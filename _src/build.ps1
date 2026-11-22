# Builds the multilingual site from _src/template.html + _src/i18n/<lang>.json
#   Spanish -> /index.html and /gracias.html   (main address, fallback language)
#   uk, en, de, ru -> /<lang>/index.html and /<lang>/gracias.html
# Run:  powershell -ExecutionPolicy Bypass -File _src\build.ps1
$ErrorActionPreference = 'Stop'
$src  = $PSScriptRoot
$root = Split-Path -Parent $src
$utf8 = New-Object System.Text.UTF8Encoding($false)

# Order = order in the language switcher and sitemap (Ukrainian first)
$langs = @('uk', 'es', 'en', 'de', 'ru')

$redirect = @'
  <script>
  /* Open the site in the visitor's language. Runs only on the main address. */
  (function(){try{
    var s=['uk','es','en','de','ru'], t=null;
    try{ t=localStorage.getItem('va-lang'); }catch(e){}
    if(!t){
      if(/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
      var l=navigator.languages||[navigator.language||''];
      for(var i=0;i<l.length;i++){ var c=String(l[i]).slice(0,2).toLowerCase(); if(c==='ua') c='uk'; if(s.indexOf(c)>-1){ t=c; break; } }
    }
    if(t && t!=='es' && s.indexOf(t)>-1){ location.replace('/'+t+'/'+location.search+location.hash); }
  }catch(e){}})();
  </script>
'@

function Read-Text($path) { [IO.File]::ReadAllText($path, $utf8) }
function Write-Text($path, $text) {
  $dir = Split-Path -Parent $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  [IO.File]::WriteAllText($path, $text, $utf8)
}

function Fill($template, $vars, $name) {
  $missing = New-Object System.Collections.Generic.List[string]
  $out = [regex]::Replace($template, '\{\{(\w+)\}\}', {
    param($m)
    $k = $m.Groups[1].Value
    if ($vars.ContainsKey($k)) { return [string]$vars[$k] }
    $missing.Add($k) | Out-Null
    return $m.Value
  })
  if ($missing.Count) { throw "$name is missing keys: $(($missing | Sort-Object -Unique) -join ', ')" }
  return $out
}

$config = Read-Text (Join-Path $src 'config.json') | ConvertFrom-Json
$page   = Read-Text (Join-Path $src 'template.html')
$thanks = Read-Text (Join-Path $src 'gracias-template.html')

foreach ($lang in $langs) {
  $json = Read-Text (Join-Path $src "i18n\$lang.json") | ConvertFrom-Json
  $vars = @{}
  foreach ($p in $config.PSObject.Properties) { $vars[$p.Name] = $p.Value }
  foreach ($p in $json.PSObject.Properties) { $vars[$p.Name] = $p.Value }
  $isMain = ($lang -eq 'es')
  $vars['path'] = if ($isMain) { '/' } else { "/$lang/" }
  $vars['redirect_script'] = if ($isMain) { $redirect } else { '' }
  $outDir = if ($isMain) { $root } else { Join-Path $root $lang }

  Write-Text (Join-Path $outDir 'index.html')   (Fill $page   $vars "$lang/index")
  Write-Text (Join-Path $outDir 'gracias.html') (Fill $thanks $vars "$lang/gracias")
  "built $($vars['path'])"
}

# sitemap.xml with language alternates
$alt = ($langs | ForEach-Object {
  $u = if ($_ -eq 'es') { 'https://vabeauty.studio/' } else { "https://vabeauty.studio/$_/" }
  "    <xhtml:link rel=`"alternate`" hreflang=`"$_`" href=`"$u`"/>"
}) -join "`n"
$alt += "`n    <xhtml:link rel=`"alternate`" hreflang=`"x-default`" href=`"https://vabeauty.studio/`"/>"
$today = Get-Date -Format 'yyyy-MM-dd'
$urls = ($langs | ForEach-Object {
  $u = if ($_ -eq 'es') { 'https://vabeauty.studio/' } else { "https://vabeauty.studio/$_/" }
  "  <url>`n    <loc>$u</loc>`n    <lastmod>$today</lastmod>`n$alt`n  </url>"
}) -join "`n"
Write-Text (Join-Path $root 'sitemap.xml') @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
$urls
</urlset>
"@

Write-Text (Join-Path $root 'robots.txt') @"
User-agent: *
Allow: /

Sitemap: https://vabeauty.studio/sitemap.xml
"@
"built sitemap.xml, robots.txt"
