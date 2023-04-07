console.log("%c • • %c Dude,\n%c ━━━ %c stop%c\n© Imagulation - " + (new Date).getFullYear(), "font-size:50px;background-color:#00BD76", "font-size:50px;color:#F00", "font-size:50px;background-color:#00BD76", "font-size:50px;color:#F00", "font-size:19.5px;color:#00BD76");
const elements = []
  , keys = {}
  , cdn = `${document.location.protocol}//${document.location.host.replace(/(www|raw)\./, "")}/cdn/`
  , notificationArea = document.getElementById("notifications")
  , menu = document.getElementById("nav-menu")
  , nav = document.getElementById("mobile-nav")
  , content = document.getElementById("content")
  , user = document.getElementById("user")
  , signInElm = `${user.innerHTML}`
  , lang = document.querySelector("html").lang ?? "en"
  , params = Object.fromEntries(new URLSearchParams(document.location.href.split("?")[1] ?? ""));
let signedIn = !1;
window.addEventListener("load", (()=>{
    for (const e of ["F", "l", "G", "o"]) {
        const t = document.getElementsByClassName(e);
        for (const e of t)
            elements.push(e)
    }
    fadeIn()
}
)),
window.addEventListener("scroll", fadeIn),
window.addEventListener("resize", fadeIn),
window.addEventListener("keydown", keyDown),
window.addEventListener("keyup", keyUp);
try {
    navigation.addEventListener("navigate", (e=>{
        if ("replace" === e.navigationType || new URL(e.destination.url).host !== window.location.host)
            return;
        let t = window.location.href.split("?")[1];
        e.destination.url.split("?")[1] !== t && (e.preventDefault(),
        t = null == t ? "" : `?${t}`,
        window.location.assign(e.destination.url + t))
    }
    ))
} catch {}
if (params.key) {
    const e = `${params.key}`;
    delete params.key;
    const t = `${new URLSearchParams(params)}`;
    window.history.replaceState({}, document.title, window.location.pathname + t + window.location.hash),
    22 === e.length && fetch("/api/get_assets?key=" + e).then((e=>{
        e.json().then((e=>{
            localStorage.setItem("guilds", JSON.stringify(e.guilds)),
            localStorage.setItem("user", JSON.stringify(e.user ?? {
                id: "",
                username: "Unknown User",
                discriminator: "0000"
            })),
            localStorage.setItem("auth", e.auth),
            delete e,
            login()
        }
        )).catch((e=>{
            new Notif(e,"e",!0)
        }
        ))
    }
    )).catch((e=>{
        new Notif(e,"e",!0)
    }
    ))
} else
    null != localStorage.getItem("user") && login();
function fadeIn() {
    if (!menu)
        return;
    menu.classList.remove("K"),
    nav.classList.remove("P");
    const e = [];
    for (let t in elements) {
        const n = elements[t];
        n.getBoundingClientRect().top - window.innerHeight + 20 < 0 && (n.classList.add("H", "Y"),
        e.push(t))
    }
    for (let t in e)
        elements.splice(e[t] - t, 1)
}
function toggleMenu() {
    menu.classList.toggle("K"),
    nav.classList.toggle("P")
}
function login() {
    const e = JSON.parse(localStorage.getItem("user"));
    user.innerHTML = `<a class="X"style="height:1.2em"onclick="logout()"tabindex="0"><div class="L">${HTMLSafe(e.username)}</div><div style="display:inline-block;vertical-align:top">#${e.discriminator}</div></a>`,
    signedIn = !0
}
function logout() {
    localStorage.clear(),
    user.innerHTML = signInElm,
    signedIn = !1
}
function keyDown(e) {
    "Enter" === e.key ? "function" == typeof e.target.onclick && e.target.onclick() : keys[e.key] = !0
}
function keyUp(e) {
    delete keys[e.key]
}
function HTMLSafe(e) {
    let t = "";
    for (const n of `${e}`)
        t += /[\x20-\x2F]/g.test(n) ? `&#x${n.charCodeAt(0).toString(16)};` : n;
    return t
}
async function apiRequest(e, t, n, o=!0) {
    return new Promise(((i,a)=>fetch("/api" + e, {
        method: t ?? "GET",
        headers: {
            Authorization: localStorage.getItem("auth")
        },
        body: JSON.stringify(n)
    }).then((e=>200 !== e.status ? e.text().then((t=>{
        !0 === o && new Notif("API Request " + e.status + ": " + t,"e",!0),
        a(t)
    }
    )).catch((e=>{
        !0 === o && new Notif("API Request: " + e,"e",!0),
        a(e)
    }
    )) : e.json().then(i).catch((()=>{
        i(e)
    }
    )))).catch((e=>{
        !0 === o && new Notif("API Request Error: " + e,"e",!0),
        a(e)
    }
    ))))
}
function download(e, t) {
    const n = window.URL.createObjectURL(new Blob([e]))
      , o = document.createElement("a");
    o.style.display = "none",
    o.href = n,
    o.download = t ?? "download.txt",
    document.body.appendChild(o),
    o.click(),
    window.URL.revokeObjectURL(n)
}
class Notif {
    #e = null;
    #t = 700;
    constructor(e, t, n, o) {
        let i = "";
        e = `${e}`,
        (null == o || isNaN(parseInt(o))) && (o = 100 * e.length + 1e3);
        const a = {
            error: ["error", "err", "e", "failure", "fail", "f", "danger", "d", "red", "r"],
            warning: ["warning", "warn", "w", "yellow", "orange", "amber"],
            success: ["success", "suc", "s", "green"],
            blue: ["blue", "b"]
        };
        if (a.error.includes(`${t}`.toLowerCase()))
            i = "background-image: linear-gradient(135deg, var(--A), var(--B));",
            t = "error";
        else if (a.warning.includes(`${t}`.toLowerCase()))
            i = "background-image: linear-gradient(135deg, var(--C), var(--D));",
            t = "warning";
        else if (a.success.includes(`${t}`.toLowerCase()))
            i = "background-image: linear-gradient(135deg, var(--w), var(--v));",
            t = "success";
        else if (a.blue.includes(`${t}`.toLowerCase()))
            i = "background-image: linear-gradient(135deg, var(--E), var(--F));",
            t = "blue";
        else {
            let e = `${t}`.replace("0x", "#").toUpperCase().match(/^#[A-F0-9]{3,4}([A-F0-9]{2})?([A-F0-9]{2})?/i);
            e = e ? e[0] : "var(--a)",
            i = `background-color: ${e}`,
            t = "custom"
        }
        if (!0 === n) {
            const n = "font-size: 30px;";
            switch (t) {
            case "error":
                console.error("%c" + e, n + "color: #f00");
                break;
            case "warning":
                console.warn("%c" + e, n + "color: #ff0");
                break;
            case "success":
                console.log("%c" + e, n + "color: #0f0");
                break;
            case "custom":
                console.log("%c" + e, n)
            }
        }
        const s = document.createElement("div");
        s.classList = "N",
        s.style = i,
        s.textContent = e,
        notificationArea.appendChild(s),
        this.text = e,
        this.type = t,
        this.expires = o + this.#t + (new Date).getTime(),
        this.style = i,
        this.#e = s,
        setTimeout((()=>this.delete(s)), parseInt(o) + this.#t)
    }
    get expired() {
        return this.expires < new Date
    }
    get animationDuration() {
        return this.#t
    }
    delete(e) {
        null == e && (e = this.#e),
        e.classList += " O Z",
        setTimeout((()=>{
            e.remove()
        }
        ), this.animationDuration)
    }
}
window.toggleMenu = toggleMenu,
window.login = login,
window.logout = logout,
window.HTMLSafe = HTMLSafe,
window.apiRequest = apiRequest,
window.Notif = Notif,
window.download = download,
window.keys = keys;
try {
    run()
} catch {}
