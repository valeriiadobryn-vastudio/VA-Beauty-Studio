// Instagram gallery: shows the latest posts of @va_beauty_studio__.
// The feed (JSON) comes from Behold (behold.so), which refreshes it from Instagram.
// It is only downloaded when the visitor scrolls near the gallery, to save
// the monthly view allowance and keep the page fast.
(() => {
  const section = document.getElementById("gallery");
  const grid = document.getElementById("instaGrid");
  if (!section || !grid) return;

  const feedUrl = (section.dataset.feed || "").trim();
  if (!feedUrl) { grid.hidden = true; return; } // not connected yet: only the "Follow" button shows

  const altText = section.dataset.alt || "Instagram";
  const MAX = 6;

  const pickImage = (p) => {
    const s = p.sizes || {};
    const best = (s.medium && s.medium.mediaUrl) || (s.small && s.small.mediaUrl) || (s.large && s.large.mediaUrl);
    if (best) return best;
    return p.mediaType === "VIDEO" ? (p.thumbnailUrl || p.mediaUrl) : (p.mediaUrl || p.thumbnailUrl);
  };

  const render = (posts) => {
    const items = posts.filter((p) => p && p.permalink && pickImage(p)).slice(0, MAX);
    if (!items.length) { grid.hidden = true; return; }
    grid.innerHTML = "";
    items.forEach((p) => {
      const a = document.createElement("a");
      a.className = "insta-item";
      a.href = p.permalink;
      a.target = "_blank";
      a.rel = "noopener";
      const img = document.createElement("img");
      img.src = pickImage(p);
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 300;
      img.height = 300;
      const caption = (p.prunedCaption || p.caption || "").replace(/\s+/g, " ").trim();
      img.alt = caption ? caption.slice(0, 120) : altText;
      a.appendChild(img);
      if (p.mediaType === "VIDEO") a.classList.add("is-video");
      if (p.mediaType === "CAROUSEL_ALBUM") a.classList.add("is-album");
      grid.appendChild(a);
    });
    grid.hidden = false;
  };

  const load = async () => {
    try {
      const res = await fetch(feedUrl);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      render(Array.isArray(data) ? data : (data.posts || []));
    } catch (e) {
      grid.hidden = true; // on any problem, fall back to just the "Follow" button
    }
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: "400px 0px" });
    io.observe(section);
  } else {
    load();
  }
})();
