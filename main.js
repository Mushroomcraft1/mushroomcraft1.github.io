console.log("%c • • %c Dude,\n%c ━━━ %c stop%c\n© Imagulation - " + new Date().getFullYear(), "font-size:50px;background-color:#00BD76", "font-size:50px;color:#F00", "font-size:50px;background-color:#00BD76", "font-size:50px;color:#F00", "font-size:19.5px;color:#00BD76")
const elements = [], keys = {}, cdn = `${document.location.protocol}//${document.location.host.replace(/(www|raw)\./, "")}/cdn/`, notificationArea = document.getElementById("notifications"), menu = document.getElementById("nav-menu"), nav = document.getElementById("mobile-nav"), content = document.getElementById("content"), user = document.getElementById("user"), signInElm = `${user.innerHTML}`, lang = document.querySelector("html").lang ?? "en", params = Object.fromEntries(new URLSearchParams(document.location.href.split("?")[1] ?? ""))
let signedIn = false

window.addEventListener("load", () => { for (const c of ["a" /* css-class */, "al" /* css-class */, "ar" /* css-class */, "ac" /* css-class */]) { const elms = document.getElementsByClassName(c); for (const e of elms) elements.push(e) }; fadeIn() })
window.addEventListener("scroll", fadeIn)
window.addEventListener("resize", fadeIn)
window.addEventListener("keydown", keyDown)
window.addEventListener("keyup", keyUp)

try {
    navigation.addEventListener("navigate", (n => {
        if (n.navigationType === "replace" || new URL(n.destination.url).host !== window.location.host) return
        let paramsStr = window.location.href.split("?")[1]
        if (n.destination.url.split("?")[1] !== paramsStr) n.preventDefault(); else return
        if (paramsStr == null) paramsStr = ""; else paramsStr = `?${paramsStr}`
        window.location.assign(n.destination.url + paramsStr)
    }))
} catch { }

if (params.key) {
    const key = `${params.key}`
    delete params.key
    const newParams = `${new URLSearchParams(params)}`
    window.history.replaceState({}, document.title, window.location.pathname + newParams + window.location.hash)
    if (key.length === 22) fetch("/api/get_assets?key=" + key)
        .then(res => {
            res.json()
                .then(json => {
                    localStorage.setItem("guilds", JSON.stringify(json.guilds))
                    localStorage.setItem("user", JSON.stringify(json.user ?? { id: "", username: "Unknown User", discriminator: "0000" }))
                    localStorage.setItem("auth", json.auth)
                    delete json
                    login()
                })
                .catch(e => {
                    new Notif(e, "e", true)
                })
        })
        .catch(e => {
            new Notif(e, "e", true)
        })
} else if (localStorage.getItem("user") != null) login()

function fadeIn() {
    if (!menu) return
    menu.classList.remove("menu-open")
    nav.classList.remove("nav-open")
    const splice = []
    for (let i in elements) {
        const e = elements[i]
        let distInView = e.getBoundingClientRect().top - window.innerHeight + 20
        if (distInView < 0) {
            e.classList.add("animated", "lolo")
            splice.push(i)
        }
    }
    for (let i in splice) elements.splice(splice[i] - i, 1)
}

function toggleMenu() {
    menu.classList.toggle("menu-open")
    nav.classList.toggle("nav-open")
}

function login() {
    const userData = JSON.parse(localStorage.getItem("user"))
    user.innerHTML = `<a class="link1"style="height:1.2em"onclick="logout()"tabindex="0"><div class="user-name">${HTMLSafe(userData.username)}</div><div style="display:inline-block;vertical-align:top">#${userData.discriminator}</div></a>`
    signedIn = true
}

function logout() {
    localStorage.clear()
    user.innerHTML = signInElm
    signedIn = false
}

function keyDown(e) {
    if (e.key === "Enter") {
        if (typeof e.target.onclick === "function") e.target.onclick()
    } else keys[e.key] = true
}

function keyUp(e) {
    delete keys[e.key]
}

function HTMLSafe(str) {
    let out = ""
    for (const char of `${str}`) out += /[\x20-\x2F]/g.test(char) ? `&#x${char.charCodeAt(0).toString(16)};` : char
    return out
}

async function apiRequest(path, method, body, loud = true) {
    return new Promise((resolve, reject) => fetch("/api" + path, { method: method ?? "GET", headers: { Authorization: localStorage.getItem("auth") }, body: JSON.stringify(body) })
        .then(res => {
            if (res.status !== 200) {
                return res.text()
                    .then(text => {
                        if (loud === true) new Notif("API Request " + res.status + ": " + text, "e", true)
                        reject(text)
                    })
                    .catch(err => {
                        if (loud === true) new Notif("API Request: " + err, "e", true)
                        reject(err)
                    })
            }
            return res.json()
                .then(resolve)
                .catch(() => {
                    resolve(res)
                })
        })
        .catch(err => {
            if (loud === true) new Notif("API Request Error: " + err, "e", true)
            reject(err)
        })
    )
}

function download(data, fileName) {
    const url = window.URL.createObjectURL(new Blob([data]))
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = fileName ?? "download.txt"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
}

class Notif {
    #elm = null
    #animationDuration = 700

    constructor(text, type, log, duration) {
        let style = ""
        text = `${text}`
        if (duration == null || isNaN(parseInt(duration))) duration = text.length * 100 + 1000
        const types = { error: ["error", "err", "e", "failure", "fail", "f", "danger", "d", "red", "r"], warning: ["warning", "warn", "w", "yellow", "orange", "amber"], success: ["success", "suc", "s", "green"], blue: ["blue", "b"] }
        if (types.error.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--red1), var(--red2));", type = "error"
        } else if (types.warning.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--yellow1), var(--yellow2));", type = "warning"
        } else if (types.success.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--theme2), var(--theme1));", type = "success"
        } else if (types.blue.includes(`${type}`.toLowerCase())) {
            style = "background-image: linear-gradient(135deg, var(--blue1), var(--blue2));", type = "blue"
        } else {
            let colour = `${type}`.replace("0x", "#").toUpperCase().match(/^#[A-F0-9]{3,4}([A-F0-9]{2})?([A-F0-9]{2})?/i)
            if (!colour) colour = "var(--light-grey)"; else colour = colour[0]
            style = `background-color: ${colour}`, type = "custom"
        }
        if (log === true) {
            const css = "font-size: 30px;"
            switch (type) {
                case "error":
                    console.error("%c" + text, css + "color: #f00")
                    break
                case "warning":
                    console.warn("%c" + text, css + "color: #ff0")
                    break
                case "success":
                    console.log("%c" + text, css + "color: #0f0")
                    break
                case "custom":
                    console.log("%c" + text, css)
                    break
            }
        }
        const elm = document.createElement("div")
        elm.classList = "notification"
        elm.style = style
        elm.textContent = text
        notificationArea.appendChild(elm)
        this.text = text, this.type = type, this.expires = duration + this.#animationDuration + new Date().getTime(), this.style = style, this.#elm = elm
        setTimeout(() => this.delete(elm), parseInt(duration) + this.#animationDuration)
    }

    get expired() {
        return this.expires < new Date()
    }

    get animationDuration() {
        return this.#animationDuration
    }

    delete(elm) {
        if (elm == null) elm = this.#elm
        elm.classList += " hiding test"
        setTimeout(() => {
            elm.remove()
        }, this.animationDuration)
    }
}

window.toggleMenu = toggleMenu
window.login = login
window.logout = logout
window.HTMLSafe = HTMLSafe
window.apiRequest = apiRequest
window.Notif = Notif
window.download = download
window.keys = keys

try {
    run()
} catch { }