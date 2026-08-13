(() => {
  const app = document.getElementById("app");

  const esc = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const byId = (id) => ATLAS.find((c) => c.id === id);

  const route = () => {
    const hash = location.hash.replace(/^#\/?/, "");
    const [page, id] = hash.split("/");
    if (!page) return { name: "home" };
    if (page === "case" && id) return { name: "case", id };
    if (["archive", "map", "hearth", "riyad"].includes(page)) return { name: page };
    return { name: "home" };
  };

  const setNav = (name) => {
    document.querySelectorAll(".mast nav a").forEach((a) => {
      a.classList.toggle("is-active", a.dataset.nav === name);
    });
  };

  const paras = (arr) => (arr || []).map((p) => `<p>${esc(p)}</p>`).join("");

  function folderCard(c, i) {
    const tilt = ((i % 5) - 2) * 0.7;
    return `
      <a class="folder" href="#/case/${c.id}" style="--tilt:${tilt}deg" data-cat="${c.category}" data-hay="${esc(`${c.title} ${c.aka} ${c.location} ${c.excerpt}`)}">
        <div class="folder-tab">${esc(c.caseNo)}</div>
        <div class="polaroid">
          <img src="${c.image}" alt="${esc(c.title)}">
          <span>${esc(c.location)}</span>
        </div>
        <div class="folder-body">
          <div class="case-no">${esc(c.category)} ${esc(c.year)}</div>
          <h3>${esc(c.title)}</h3>
          <p class="meta">${esc(c.excerpt)}</p>
          <div class="stamps">
            <span class="stamp">${esc(c.status)}</span>
            <span class="stamp amber">${esc(c.classification.split(" / ")[0])}</span>
          </div>
          <div class="wax" aria-hidden="true">${c.caseNo.slice(-2)}</div>
        </div>
      </a>`;
  }

  function renderHome() {
    setNav("home");
    const featured = ["dyatlov", "voynich", "bermuda", "bigfoot"].map(byId);
    app.innerHTML = `
      <section class="cabin view">
        <div class="plaque">
          <p class="eyebrow">A cabin archive built by Riyad</p>
          <h1>The Dark Atlas</h1>
          <p class="lede">Mysteries, legends, lost civilizations, and the places that will not explain themselves.</p>
          <div class="cta-row">
            <a class="btn" href="#/archive">Open the case files</a>
            <a class="btn ghost" href="#/map">Consult the map</a>
          </div>
          <p class="epigraph">“Not all that is lost wishes to be found.”</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">On the desk tonight</p>
            <h2>Files left open</h2>
            <p>Four dossiers the last keeper did not put away. The rest wait on the shelf.</p>
          </div>
          <a class="btn ghost" href="#/archive">The full cabinet</a>
        </div>
        <div class="shelf">${featured.map(folderCard).join("")}</div>
      </section>`;
  }

  function renderArchive(filter = "all", q = "") {
    setNav("archive");
    const query = q.trim().toLowerCase();
    const list = ATLAS.filter((c) => {
      const catOk = filter === "all" || c.category === filter;
      const hay = `${c.title} ${c.aka} ${c.location} ${c.excerpt} ${c.classification}`.toLowerCase();
      return catOk && (!query || hay.includes(query));
    });
    app.innerHTML = `
      <section class="panel view">
        <div class="panel-head">
          <div>
            <p class="eyebrow">The cabinet</p>
            <h2>Case Files</h2>
            <p>Twelve open dossiers. Each is a legend with a date, a place, and a remaining silence.</p>
          </div>
          <div class="search-wrap">
            <input id="q" type="search" placeholder="Search the shelves…" value="${esc(q)}" autocomplete="off">
          </div>
        </div>
        <div class="drawers" id="drawers">
          ${CATEGORIES.map((cat) => `<button class="drawer ${cat.id === filter ? "is-on" : ""}" data-cat="${cat.id}" type="button">${esc(cat.label)}</button>`).join("")}
        </div>
        <div class="shelf">
          ${list.length ? list.map(folderCard).join("") : `<p class="empty-shelf">No file matches that search.</p>`}
        </div>
      </section>`;
    const input = document.getElementById("q");
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => renderArchive(filter, input.value), 80);
    });
    document.getElementById("drawers").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (btn) {
        AtlasSound.play("drawer");
        renderArchive(btn.dataset.cat, document.getElementById("q").value);
      }
    });
  }

  function renderMap() {
    setNav("map");
    app.innerHTML = `
      <section class="panel map-stage view">
        <div class="panel-head">
          <div>
            <p class="eyebrow">The table</p>
            <h2>A Map of the Unexplained</h2>
            <p>Pins on an old chart. Hover to read the margin. Click to open the file.</p>
          </div>
        </div>
        <div class="map-frame">
          <div class="map-plot" id="mapFrame">
            <img class="atlas" src="antique-map.jpg" alt="Antique stained world map">
            ${ATLAS.map((c) => `<button class="pin" style="left:${c.map.x}%;top:${c.map.y}%" data-id="${c.id}" aria-label="${esc(c.title)}"></button>`).join("")}
            <div class="map-tip" id="mapTip"></div>
          </div>
        </div>
      </section>`;
    const tip = document.getElementById("mapTip");
    const frame = document.getElementById("mapFrame");
    frame.querySelectorAll(".pin").forEach((pin) => {
      const c = byId(pin.dataset.id);
      const show = () => {
        tip.innerHTML = `<h4>${esc(c.title)}</h4><p>${esc(c.location)}, ${esc(c.year)}</p>`;
        tip.style.left = pin.style.left;
        tip.style.top = pin.style.top;
        tip.classList.add("is-on");
        pin.classList.add("is-on");
        AtlasSound.play("pin");
      };
      const hide = () => {
        tip.classList.remove("is-on");
        pin.classList.remove("is-on");
      };
      pin.addEventListener("mouseenter", show);
      pin.addEventListener("focus", show);
      pin.addEventListener("mouseleave", hide);
      pin.addEventListener("blur", hide);
      pin.addEventListener("click", () => {
        AtlasSound.play("latch");
        location.hash = `#/case/${c.id}`;
      });
    });
  }

  function renderHearth() {
    setNav("hearth");
    app.innerHTML = `
      <section class="panel view">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Beside the fire</p>
            <h2>The Hearth</h2>
          </div>
        </div>
        <div class="hearth">
          <article class="paper-sheet">
            <h2>How this cabin keeps files</h2>
            <p>The Dark Atlas is a private archive of things the daylight world has not finished with. It is not a court. It does not close cases to make the shelves tidy. It keeps the legend, the dates, the evidence, the theories, and the remainder, the part that still will not sit still.</p>
            <p>Each dossier is built the same way a woodsman lays a fire: kindling first (the story as it is told), then the seasoned wood (what the record actually holds), then the long coals (what remains unexplained).</p>
            <h3>How to read a file</h3>
            <p><b>The legend</b> is the tale as it walks into the room. <b>The history</b> is the sequence that can be dated. <b>The evidence</b> is what can be held or sworn to. <b>The theories</b> are the best attempts to make the evidence behave. <b>The unexplained</b> is why the folder is still on the desk.</p>
          </article>
          <div class="side-stack">
            <aside class="clipping">
              <h3>The collection</h3>
              <div class="stat-row">
                <div class="stat"><b>12</b><span>Open cases</span></div>
                <div class="stat"><b>0</b><span>Closed</span></div>
                <div class="stat"><b>∞</b><span>Questions</span></div>
              </div>
            </aside>
            <aside class="clipping" style="transform:rotate(-1deg)">
              <h3>Draw a file at random</h3>
              <p>Chance is an old librarian.</p>
              <p><a class="btn" href="#/case/${ATLAS[Math.floor(Math.random() * ATLAS.length)].id}">Take a folder</a></p>
            </aside>
          </div>
        </div>
      </section>`;
  }

  function renderRiyad() {
    setNav("riyad");
    app.innerHTML = `
      <section class="panel view keeper-page">
        <div class="panel-head">
          <div>
            <p class="eyebrow">The keeper of the archive</p>
            <h2>Built by Riyad</h2>
            <p>The Dark Atlas is a cabin project by Riyad Khairoun.</p>
          </div>
        </div>
        <div class="keeper">
          <figure class="keeper-frame">
            <img src="riyad.jpg" alt="Riyad">
            <figcaption>Riyad, Morocco</figcaption>
          </figure>
          <article class="paper-sheet keeper-note">
            <p class="eyebrow" style="color:#8a5a10">Credits</p>
            <h2>Riyad</h2>
            <p>Hey, I'm a high school student and creator of The Dark Atlas. I built this project out of my curiosity for the unexplained, forgotten history, strange stories, and mysteries that continue to fascinate people around the world. The Dark Atlas is my way of turning that curiosity into something others can explore..</p>
            <p>If you walked in, sat down, and opened a folder: that was the point.</p>
            <div class="socials">
              <button type="button" class="social" data-url="https://instagram.com/vampriyad"><b>Instagram</b><span>instagram.com/vampriyad</span></button>
              <button type="button" class="social" data-url="https://www.tiktok.com/@vampriyad"><b>TikTok</b><span>tiktok.com/@vampriyad</span></button>
              <button type="button" class="social" data-url="https://www.reddit.com/user/vampriyad"><b>Reddit</b><span>reddit.com/user/vampriyad</span></button>
              <button type="button" class="social" data-url="https://www.snapchat.com/add/vampriyad"><b>Snapchat</b><span>snapchat.com/add/vampriyad</span></button>
              <button type="button" class="social" data-url="https://github.com/vampriyad"><b>GitHub</b><span>github.com/vampriyad</span></button>
            </div>
          </article>
        </div>
      </section>`;
  }

  function renderCase(id) {
    const c = byId(id);
    if (!c) return renderArchive();
    setNav("archive");
    const related = (c.related || []).map(byId).filter(Boolean);
    app.innerHTML = `
      <section class="desk view">
        <a class="backlink" href="#/archive">← Return to the cabinet</a>
        <article class="dossier">
          <aside class="dossier-side">
            <figure class="frame">
              <img src="${c.image}" alt="${esc(c.title)}">
              <figcaption>${esc(c.credit)}</figcaption>
            </figure>
            <div class="side-card">
              <dl>
                <dt>File</dt><dd>${esc(c.caseNo)}</dd>
                <dt>Also known as</dt><dd>${esc(c.aka)}</dd>
                <dt>Locus</dt><dd>${esc(c.location)}</dd>
                <dt>Coordinates</dt><dd>${esc(c.coords)}</dd>
                <dt>Era</dt><dd>${esc(c.era)}</dd>
                <dt>Class</dt><dd>${esc(c.classification)}</dd>
              </dl>
            </div>
          </aside>
          <div class="dossier-main">
            <div class="file-top">
              <div>
                <div class="case-no">${esc(c.caseNo)} ${esc(c.category)}</div>
                <h1>${esc(c.title)}</h1>
                <p class="meta">${esc(c.excerpt)}</p>
              </div>
              <div class="stamps">
                <span class="stamp">${esc(c.status)}</span>
                <span class="stamp amber">${esc(c.year)}</span>
              </div>
            </div>
            <div class="tabs" role="tablist">
              <button class="tab is-on" data-tab="legend" type="button">Legend</button>
              <button class="tab" data-tab="history" type="button">History</button>
              <button class="tab" data-tab="evidence" type="button">Evidence</button>
              <button class="tab" data-tab="theories" type="button">Theories</button>
              <button class="tab" data-tab="unexplained" type="button">Unexplained</button>
            </div>
            <div class="pane" id="pane"></div>
            <p class="note">${esc(c.note)}</p>
            <div class="related">
              <h3>Cross-references</h3>
              <div class="related-row">
                ${related.map((r) => `<a href="#/case/${r.id}">${esc(r.caseNo)} ${esc(r.title)}</a>`).join("")}
                <a href="#/map">See on the map</a>
              </div>
            </div>
          </div>
        </article>
      </section>`;

    const pane = document.getElementById("pane");
    const tabs = {
      legend: `<h3>The legend as it is told</h3>${paras(c.legend)}`,
      history: `<h3>What the record holds</h3>${paras(c.history)}`,
      evidence: `<h3>Entered in evidence</h3>
        ${c.id === "wow-signal" ? `<div class="printout">BIG EAR / OHIO STATE   15 AUG 1977   1420 MHz
6EQUJ5
<span class="wow">     ^ Wow!</span>
J. Ehman, 18 Aug 1977</div><br>` : ""}
        <div class="evidence-grid">${c.evidence.map((e) => `<div class="ev"><b>${esc(e.t)}</b>${esc(e.d)}</div>`).join("")}</div>`,
      theories: `<h3>Attempts to make it behave</h3>${c.theories.map((th) => `<div class="theory"><h4>${esc(th.name)}</h4><div class="likelihood">${esc(th.likelihood)}</div><p>${esc(th.text)}</p></div>`).join("")}`,
      unexplained: `<h3>What remains on the desk</h3>${paras(c.unexplained)}`
    };
    const show = (key) => {
      pane.innerHTML = tabs[key];
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-on", t.dataset.tab === key));
    };
    show("legend");
    document.querySelector(".tabs").addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab]");
      if (t) {
        AtlasSound.play("page");
        show(t.dataset.tab);
      }
    });
  }

  const titles = {
    home: "The Dark Atlas, An Archive of the Unexplained",
    archive: "Case Files, The Dark Atlas",
    map: "The Map, The Dark Atlas",
    hearth: "The Hearth, The Dark Atlas",
    riyad: "Riyad, The Dark Atlas"
  };

  function render() {
    const r = route();
    if (r.name === "home") renderHome();
    else if (r.name === "archive") renderArchive();
    else if (r.name === "map") renderMap();
    else if (r.name === "hearth") renderHearth();
    else if (r.name === "riyad") renderRiyad();
    else if (r.name === "case") renderCase(r.id);
    const c = r.name === "case" ? byId(r.id) : null;
    document.title = c ? `${c.title}, ${c.caseNo}, The Dark Atlas` : titles[r.name] || titles.home;
    AtlasSound.unlock();
  }

  window.addEventListener("hashchange", () => {
    AtlasSound.play("page");
    render();
  });
  render();

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;
    e.preventDefault();
    if (location.hash === href) render();
    else location.hash = href;
    AtlasSound.unlock();
    AtlasSound.play("page");
  });
})();
