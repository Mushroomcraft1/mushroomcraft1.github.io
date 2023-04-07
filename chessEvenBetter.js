const Pieces = {
    Pawn: 2,
    Knight: 4,
    Bishop: 6,
    Rook: 8,
    Queen: 10,
    King: 12
}

const Annotations = {
    Brilliant: 0,
    Dubious: 1,
    Great: 2,
    Best: 3,
    Good: 4,
    Inaccurate: 5,
    Mistake: 6,
    Blunder: 7,
    Miss: 8,
    Book: 9,
    Forced: 10
}

const Value = {
    2: 1,
    4: 3,
    6: 3.2,
    8: 5,
    10: 9,
    12: 0
}

const Colours = {
    Black: 0,
    White: 1
}

const Moves = {
    Slide: 0,
    Jump: 1,
    Castling: 2,
    DoublePawnMove: 3,
    EnPassant: 4,
    Promoting: 5
}

const Offsets = [8, -8, -1, 1, 7, -7, 9, -9]

// Generalised map of where each piece should go (0-7)
const PositionalScores = {
    2: [ // Black Pawn
        0, 0, 0, 0, 0, 0, 0, 0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5, 5, 10, 25, 25, 10, 5, 5,
        0, 0, 0, 20, 20, 0, 0, 0,
        5, -5, -10, 0, 0, -10, -5, 5,
        5, 10, 10, -20, -20, 10, 10, 5,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    3: [ // White Pawn
        0, 0, 0, 0, 0, 0, 0, 0,
        5, 10, 10, -20, -20, 10, 10, 5,
        5, -5, -10, 0, 0, -10, -5, 5,
        0, 0, 0, 20, 20, 0, 0, 0,
        5, 5, 10, 25, 25, 10, 5, 5,
        10, 10, 20, 30, 30, 20, 10, 10,
        50, 50, 50, 50, 50, 50, 50, 50,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    4: [ // Black Knight
        -50, -60, -40, -30, -30, -40, -60, -50,
        -40, -20, 0, 0, 0, 0, -20, -40,
        -30, 0, 10, 15, 15, 10, 0, -30,
        -30, 5, 15, 20, 20, 15, 5, -30,
        -30, 0, 15, 20, 20, 15, 0, -30,
        -30, 5, 10, 15, 15, 10, 5, -30,
        -40, -20, 0, 5, 5, 0, -20, -40,
        -50, -60, -40, -30, -30, -40, -60, -50
    ],
    5: [ // White Knight
        -50, -60, -40, -30, -30, -40, -60, -50,
        -40, -20, 0, 5, 5, 0, -20, -40,
        -30, 5, 10, 15, 15, 10, 5, -30,
        -30, 0, 15, 20, 20, 15, 0, -30,
        -30, 5, 15, 20, 20, 15, 5, -30,
        -30, 0, 10, 15, 15, 10, 0, -30,
        -40, -20, 0, 0, 0, 0, -20, -40,
        -50, -60, -40, -30, -30, -40, -60, -50
    ],
    6: [ // Black Bishop
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10, 5, 0, 0, 0, 0, 5, -10,
        -10, 10, 10, 10, 10, 10, 10, -10,
        -10, 0, 10, 10, 10, 10, 0, -10,
        -10, 5, 5, 10, 10, 5, 5, -10,
        -10, 0, 5, 10, 10, 5, 0, -10,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -20, -10, -10, -10, -10, -10, -10, -20
    ],
    7: [ // White Bishop
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 10, 10, 5, 0, -10,
        -10, 5, 5, 10, 10, 5, 5, -10,
        -10, 0, 10, 10, 10, 10, 0, -10,
        -10, 10, 10, 10, 10, 10, 10, -10,
        -10, 5, 0, 0, 0, 0, 5, -10,
        -20, -10, -10, -10, -10, -10, -10, -20],
    8: [ // Black Rook
        0, 0, 0, 0, 0, 0, 0, 0,
        5, 10, 10, 10, 10, 10, 10, 5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        0, -50, 0, 15, 5, 15, -50, 0
    ],
    9: [ // White Rook
        0, -50, 0, 15, 5, 15, -50, 0,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        5, 10, 10, 10, 10, 10, 10, 5,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    10: [ // Black Queen
        -20, -10, -10, -5, -5, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 5, 5, 5, 0, -10,
        -5, 0, 5, 5, 5, 5, 0, -5,
        0, 0, 5, 5, 5, 5, 0, -5,
        -10, 5, 5, 5, 5, 5, 0, -10,
        -10, 0, 5, 0, 0, 0, 0, -10,
        -20, -10, -10, -5, -5, -10, -10, -20
    ],
    11: [ // White Queen
        -20, -10, -10, -5, -5, -10, -10, -20,
        -10, 0, 0, 0, 0, 5, 0, -10,
        -10, 0, 5, 5, 5, 5, 5, -10,
        -5, 0, 5, 5, 5, 5, 0, 0,
        -5, 0, 5, 5, 5, 5, 0, -5,
        -10, 0, 5, 5, 5, 5, 0, -10,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -20, -10, -10, -5, -5, -10, -10, -20
    ],
    12: [ // Black King
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10,
        20, 20, -5, -15, -15, -5, 20, 20,
        20, 40, 10, 0, 0, 5, 40, 20
    ],
    13: [ // White King
        20, 40, 10, 0, 0, 5, 40, 20,
        20, 20, -5, -15, -15, -5, 20, 20,
        -10, -20, -20, -20, -20, -20, -20, -10,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30
    ],
    14: [ // Black King End-Game
        -50, -40, -30, -20, -20, -30, -40, -50,
        -30, -20, -10, 0, 0, -10, -20, -30,
        -30, -10, 20, 30, 30, 20, -10, -30,
        -30, -10, 30, 40, 40, 30, -10, -30,
        -30, -10, 30, 40, 40, 30, -10, -30,
        -30, -10, 20, 30, 30, 20, -10, -30,
        -30, -30, 0, 0, 0, 0, -30, -30,
        -50, -30, -30, -30, -30, -30, -30, -50
    ],
    15: [ // White King End-Game
        -50, -30, -30, -30, -30, -30, -30, -50,
        -30, -30, 0, 0, 0, 0, -30, -30,
        -30, -10, 20, 30, 30, 20, -10, -30,
        -30, -10, 30, 40, 40, 30, -10, -30,
        -30, -10, 30, 40, 40, 30, -10, -30,
        -30, -10, 20, 30, 30, 20, -10, -30,
        -30, -20, -10, 0, 0, -10, -20, -30,
        -50, -40, -30, -20, -20, -30, -40, -50
    ]
}

// Calculate the moves to the edge of the board from every position
const MovesToEdge = []

for (let i = 0; i < 64; i++) {
    const rank = Math.floor(i / 8)
    const file = i - rank * 8
    MovesToEdge[i] = [8 - rank, rank + 1, file + 1, 8 - file, Math.min(file + 1, 8 - rank), Math.min(8 - file, rank + 1), Math.min(8 - file, 8 - rank), Math.min(file + 1, rank + 1)]
}

// Generating the hash table for Zobrist hashing
const Seed = 5724051002
const HashTable = []
const random = mulberry32(Seed)
for (let i = 0; i < 1536; i++) {
    HashTable[i] = random() * 4294967296
}

const options = {
    black: {
        computer: false,
        timeLimit: 3000,
        minDepth: 3,
        depthLimit: 5 // Only used if timeLimit is undefined
    },
    white: {
        computer: false,
        timeLimit: 3000,
        minDepth: 3,
        depthLimit: 5 // Only used if timeLimit is undefined
    },
    workersLimit: navigator.hardwareConcurrency ?? 4
}

const mouse = { x: 0, y: 0, click: false, acknowledged: true }

const workers = {}
let code
let book
let thinking = false
let boardTemp
let positionCount
let transpositions = new Map()
let annotation
let evalBar = 0
let boardEval = 0.5
let moves = []

const display = {
    eval: true,
    analysis: false,
    debug: false,
    highlightedMoves: [],
    highlightedSquares: [],
    arrows: []
}

const styles = {
    white: "#CCC",
    black: "#333",
    evalBlack: "#000",
    evalWhite: "#FFF",
    moveHighlight: "#FF06",
    availableMovesHighlight: "#1116",
    arrows: "#F808",
    checkIndicator: "#F00",
    shadow: "#1116",
    debug: "#F00",
    font: "Consolas",
    pieces: null,
    pieceSizeX: 0,
    pieceSizeY: 0,
    annotations: null,
    annotationSizeX: 0,
    annotationSizeY: 0
}

const text = {
    black: {
        checkmate: "Black wins by checkmate!"
    },
    white: {
        checkmate: "White wins by checkmate!"
    },
    draw: {
        stalemate: "Draw by stalemate!",
        repetition: "Draw by repetition!"
    }
}

const tests = [
    {
        depth: 1,
        nodes: 8,
        fen: "r6r/1b2k1bq/8/8/7B/8/8/R3K2R b KQ - 3 2"
    },
    {
        depth: 1,
        nodes: 8,
        fen: "8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3"
    },
    {
        depth: 1,
        nodes: 19,
        fen: "r1bqkbnr/pppppppp/n7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 2 2"
    },
    {
        depth: 1,
        nodes: 5,
        fen: "r3k2r/p1pp1pb1/bn2Qnp1/2qPN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQkq - 3 2"
    },
    {
        depth: 1,
        nodes: 44,
        fen: "2kr3r/p1ppqpb1/bn2Qnp1/3PN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQ - 3 2"
    },
    {
        depth: 1,
        nodes: 39,
        fen: "rnb2k1r/pp1Pbppp/2p5/q7/2B5/8/PPPQNnPP/RNB1K2R w KQ - 3 9"
    },
    {
        depth: 1,
        nodes: 9,
        fen: "2r5/3pk3/8/2P5/8/2K5/8/8 w - - 5 4"
    },
    {
        depth: 3,
        nodes: 62379,
        fen: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"
    },
    {
        depth: 3,
        nodes: 89890,
        fen: "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"
    },
    {
        depth: 6,
        nodes: 1134888,
        fen: "3k4/3p4/8/K1P4r/8/8/8/8 b - - 0 1"
    },
    {
        depth: 6,
        nodes: 1015133,
        fen: "8/8/4k3/8/2p5/8/B2P2K1/8 w - - 0 1"
    },
    {
        depth: 6,
        nodes: 1440467,
        fen: "8/8/1k6/2b5/2pP4/8/5K2/8 b - d3 0 1"
    },
    {
        depth: 6,
        nodes: 661072,
        fen: "5k2/8/8/8/8/8/8/4K2R w K - 0 1"
    },
    {
        depth: 6,
        nodes: 803711,
        fen: "3k4/8/8/8/8/8/8/R3K3 w Q - 0 1"
    },
    {
        depth: 4,
        nodes: 1274206,
        fen: "r3k2r/1b4bq/8/8/8/8/7B/R3K2R w KQkq - 0 1"
    },
    {
        depth: 4,
        nodes: 1720476,
        fen: "r3k2r/8/3Q4/8/8/5q2/8/R3K2R b KQkq - 0 1"
    },
    {
        depth: 6,
        nodes: 3821001,
        fen: "2K2r2/4P3/8/8/8/8/8/3k4 w - - 0 1"
    },
    {
        depth: 5,
        nodes: 1004658,
        fen: "8/8/1P2K3/8/2n5/1q6/8/5k2 b - - 0 1"
    },
    {
        depth: 6,
        nodes: 217342,
        fen: "4k3/1P6/8/8/8/8/K7/8 w - - 0 1"
    },
    {
        depth: 6,
        nodes: 92683,
        fen: "8/P1k5/K7/8/8/8/8/8 w - - 0 1"
    },
    {
        depth: 6,
        nodes: 2217,
        fen: "K1k5/8/P7/8/8/8/8/8 w - - 0 1"
    },
    {
        depth: 7,
        nodes: 567584,
        fen: "8/k1P5/8/1K6/8/8/8/8 w - - 0 1"
    },
    {
        depth: 4,
        nodes: 23527,
        fen: "8/8/2k5/5q2/5n2/8/5K2/8 b - - 0 1"
    }
]

class Move {
    constructor(board, square1, square2, type, promotion) {
        this.enpassant = board.enpassant
        this.castling = board.castling
        this.score = 0 // For move ordering
        if (square2 != null) {
            // The move is being constructed normally
            // Setting all inputted variables as global variables
            this.type = type
            this.promotion = promotion
            this.square1 = square1
            this.square2 = square2
        } else if (typeof square1 === "number") {
            // The move is being constructed from an integer reperesentation of a move
            // if the move is a promotion
            if (square1 > 6363) {
                this.promotion = square1 % 10
                this.square1 = Math.floor(square1 / 10000)
                this.square2 = (square1 - this.square1 * 10000) / 100
                this.type = Moves.Promoting
            } else {
                this.square1 = Math.floor(square1 / 100)
                this.square2 = square1 - this.square1 * 100
                this.#setData(board)
            }
        } else if (typeof square1 === "string") {
            if (square1.match(/^([a-h][1-8])([a-h][1-8])([nbrq])?$/i)) {
                // ok ok, its UCI, simple
                this.square1 = board.parseSquare(square1[0] + square1[1])
                this.square2 = board.parseSquare(square1[2] + square1[3])
                this.#setData(board)
                if (square1.length === 5) {
                    this.promotion = { k: 4, b: 6, r: 8, q: 10 }[square1[4].toLowerCase()]
                    this.type = Moves.Promoting
                }
            } else {
                // Algebraic notation... fun
                // Move must be castling
                let algebraic
                if (square1.match(/[0o]/i)) {
                    // This is the easy bit
                    algebraic = square1.replaceAll("-", "").toUpperCase().replaceAll("0", "O")
                    this.piece = Pieces.King
                    this.type = Moves.Castling
                    this.square1 = board.turn === Colours.Black ? 60 : 4
                    if (algebraic === "OOO") {
                        // Long castle
                        this.square2 = this.square1 + Offsets[2] * 2
                    } else if (algebraic === "OO") {
                        // Short castle
                        this.square2 = this.square1 + Offsets[3] * 2
                    }
                } else {
                    algebraic = square1.replaceAll(/[^NBRQKa-h1-8]/g, "") // Get rid of useless information, like if the move takes a piece, or if the move is checkmate ect.
                    if (algebraic.match(/^[NBRQK]/)) {
                        this.piece = { N: Pieces.Knight, B: Pieces.Bishop, R: Pieces.Rook, Q: Pieces.Queen, K: Pieces.King }[algebraic[0]]
                        algebraic = algebraic.slice(1)
                    } else this.piece = Pieces.Pawn
                    if (algebraic.match(/[NBRQ]$/)) {
                        // If the string ends with N, B, R, Q then it should be a promotion
                        this.promotion = { N: Pieces.Knight, B: Pieces.Bishop, R: Pieces.Rook, Q: Pieces.Queen }[algebraic[algebraic.length - 1]]
                        algebraic = algebraic.slice(0, -1)
                    }
                    if (algebraic.length > 1) {
                        this.square2 = board.parseSquare(algebraic.slice(-2))
                        algebraic = algebraic.slice(0, -2)
                        // Now to reverse engineer the move from just the end square and the piece... fun!
                        // The only real possible way is to just check it against all the legal moves
                        // Luckily I have a list of all the legal moves in the current position
                        const possibleMoves = []
                        for (const move of board.legalMoves) {
                            if (move.square2 === this.square2 && move.piece === this.piece) {
                                if (move.type === Moves.Promoting) {
                                    if (move.promotion === this.promotion) possibleMoves.push(move)
                                } else {
                                    possibleMoves.push(move)
                                }
                            }
                        }
                        if (possibleMoves.length === 1) {
                            // Nice! We have found the move!
                            this.square1 = possibleMoves[0].square1
                            this.type = possibleMoves[0].type
                        } else if (possibleMoves.length > 1) {
                            // Gotta parse more of the string :(
                            let rank
                            let file
                            const remainingMoves = []
                            if (algebraic.match(/[1-8]$/)) rank = parseInt(algebraic[0]) - 1
                            if (algebraic.match(/^[a-h]/)) file = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 }[algebraic[algebraic.length - 1]]
                            for (const move of possibleMoves) {
                                const moveRank = Math.floor(move.square1 / 8)
                                const moveFile = move.square1 - moveRank * 8
                                if (moveRank === rank) {
                                    if (file) {
                                        if (moveFile === file) remainingMoves.push(move)
                                    } else remainingMoves.push(move)
                                } else if (moveFile === file) remainingMoves.push(move)
                            }
                            if (remainingMoves.length === 1) {
                                this.square1 = remainingMoves[0].square1
                                this.type = remainingMoves[0].type
                            }
                        }
                    }
                }
            }
        }
        if (board.data[this.square2]) this.taken = board.data[this.square2]
        this.piece = board.data[this.square1] >> 1 << 1 // Removing the last bit as it determines the colour
        this.colour = board.data[this.square1] & 1 // Setting the last bit as its own variable
        this.id = this.square1 + "-" + this.square2 + "-" + this.colour + "-" + this.type + "-" + (this.promotion ?? "")
    }

    do(board) {
        let enpassant = null
        board.data[this.square1] = null
        board.data[this.square2] = this.piece + this.colour
        if (this.type === Moves.EnPassant) {
            // If the piece is white, we need to capture a rank below, else we need to capture a rank above
            if (this.colour === Colours.White) board.data[this.square2 + Offsets[1]] = null
            else board.data[this.square2 + Offsets[0]] = null
        }
        else if (this.type === Moves.Promoting) board.data[this.square2] = this.promotion + this.colour
        else if (this.type === Moves.DoublePawnMove) enpassant = this.colour === Colours.White ? this.square2 + Offsets[1] : this.square2 + Offsets[0]
        if (this.type === Moves.Castling) {
            // If square2 > square1 then the castling is king-side, else it's queen-side
            if (this.square2 > this.square1) board.data[this.square2 + Offsets[2]] = Pieces.Rook + this.colour, board.data[this.square2 + Offsets[3]] = null
            else board.data[this.square2 + Offsets[3]] = Pieces.Rook + this.colour, board.data[this.square2 + Offsets[2] * 2] = null
        }
        if (this.piece === Pieces.Rook) {
            if (this.colour === Colours.White) {
                if (this.square1 === 0) {
                    board.castling = board.castling.replaceAll("Q", "")
                } else if (this.square1 === 7) {
                    board.castling = board.castling.replaceAll("K", "")
                }
            } else {
                if (this.square1 === 56) {
                    board.castling = board.castling.replaceAll("q", "")
                } else if (this.square1 === 63) {
                    board.castling = board.castling.replaceAll("k", "")
                }
            }
        } else if (this.piece === Pieces.King) {
            board.castling = board.castling.replaceAll(this.colour === Colours.White ? /[KQ]/g : /[kq]/g, "")
        }
        if (this.square2 === 0) board.castling = board.castling.replaceAll("Q", "")
        if (this.square2 === 7) board.castling = board.castling.replaceAll("K", "")
        if (this.square2 === 56) board.castling = board.castling.replaceAll("q", "")
        if (this.square2 === 63) board.castling = board.castling.replaceAll("k", "")
        board.update(false, enpassant)
    }

    undo(board) {
        // The same as making a move, but in reverse, and if the move type is special, the conditions can also be reversed
        board.data[this.square1] = this.piece + this.colour
        board.data[this.square2] = this.taken
        if (this.type === Moves.EnPassant) {
            // If the piece is white, we need to capture a rank below, else we need to capture a rank above
            if (this.colour === Colours.White) board.data[this.square2 + Offsets[1]] = Pieces.Pawn + Colours.Black
            else board.data[this.square2 + Offsets[0]] = Pieces.Pawn + Colours.White
        }
        else if (this.type === Moves.Castling) {
            // If square2 > square1 then the castling is king-side, else it's queen-side
            if (this.square2 > this.square1) board.data[this.square2 + Offsets[2]] = null, board.data[this.square2 + Offsets[3]] = Pieces.Rook + this.colour
            else board.data[this.square2 + Offsets[3]] = null, board.data[this.square2 + Offsets[2] * 2] = Pieces.Rook + this.colour
        }
        board.update(true, this.enpassant, this.castling)
    }

    toAlgebraicNotation(board) {
        if (this.type === Moves.Castling) {
            if (this.square2 === 6 || this.square2 === 62) return "O-O"
            else return "O-O-O"
        }
        return { 2: "", 4: "N", 6: "B", 8: "R", 10: "Q", 12: "K" }[this.piece] + (this.taken ? "x" : "") + board.intSquareToString(this.square2) + (this.promotion ? "=" + { 4: "N", 6: "B", 8: "R", 10: "Q" }[this.promotion] : "")
    }

    toUCIString(board) {
        return board.intSquareToString(this.square1) + board.intSquareToString(this.square2) + (this.promotion ? { 4: "k", 6: "b", 8: "r", 10: "q" }[this.promotion] : "")
    }

    toInt() {
        return parseInt(this.square1 + "" + this.square2 + "" + (this.promotion ?? ""))
    }

    #setData(board) {
        this.piece = board.data[this.square1] >> 1 << 1 // Removing the last bit as it determines the colour
        this.colour = board.data[this.square1] & 1 // Setting the last bit as its own variable
        switch (this.piece) {
            case Pieces.King:
                this.type = Moves.Slide
                if (Math.abs(this.square1 - this.square2) === 2) this.type = Moves.Castling
                break
            case Pieces.Knight:
                this.type = Moves.Jump
                break
            case Pieces.Bishop:
                this.type = Moves.Slide
                break
            case Pieces.Rook:
                this.type = Moves.Slide
                break
            case Pieces.Queen:
                this.type = Moves.Slide
                break
            case Pieces.Pawn:
                this.type = Moves.Slide
                if (Math.abs(this.square1 - this.square2) === 16) this.type = Moves.DoublePawnMove
                else if (this.square2 - Offsets[this.colour] === board.EnPassant) this.type = Moves.EnPassant
                break
        }
    }
}

class Board {
    constructor(data) {
        this.data = []
        this[0] = {
            Pieces: [],
            Attacking: [],
            Pinned: [],
            BlockCheck: [],
            Attacker: null,
            KingLocation: null,
            Check: null,
            DoubleCheck: null
        }
        this[1] = {
            Pieces: [],
            Attacking: [],
            Pinned: [],
            BlockCheck: [],
            Attacker: null,
            KingLocation: null,
            Check: null,
            DoubleCheck: null
        }
        this.legalMoves = []
        this.castling = ""
        this.enpassant = null
        this.turn = 0
        this.moveN = 0
        this.state = null
        this.gameStateText = ""
        this.previousPosition = null

        this.fromFEN(data)
    }

    // Outputs the current board position to FEN (Forsyth–Edwards Notation)
    toFEN() {
        let fen = ""
        for (let rank = 0; rank < 8; rank++) {
            let emptyCount = 0
            for (let file = 7; file >= 0; file--) {
                if (this.data[(rank * 8 + file - 63) * -1]) {
                    if (emptyCount > 0) fen += emptyCount
                    fen += ["p", "P", "n", "N", "b", "B", "r", "R", "q", "Q", "k", "K"][this.data[(rank * 8 + file - 63) * -1] - 2]
                    emptyCount = 0
                } else emptyCount++
            }
            if (emptyCount > 0) fen += emptyCount
            fen += "/"
        }
        return `${fen.slice(0, -1)} ${["b", "w"][this.turn]} ${this.castling} ${this.intSquareToString(this.enpassant)} 0 ${this.moveN}`
    }

    // Loads a board position from a FEN (Forsyth–Edwards Notation) string
    fromFEN(data) {
        this.data = new Array(64).fill(null)
        const split = (data ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1").split(" ")
        let file = 0, rank = 7
        for (let i = 0; i < split[0].length; i++) {
            const char = split[0][i]
            if (char === "/") {
                file = 0; rank--
            } else {
                if (char.match(/\d/)) {
                    file += parseInt(char)
                } else if (char.match(/[kqrbnp]/i)) {
                    const idx = rank * 8 + file
                    this.data[idx] = Pieces[{ p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" }[char.toLowerCase()]] + (char.match(/[KQRBNP]/) ? Colours.White : Colours.Black)
                    this[this.data[idx] & 1].Pieces.push(idx)
                    file++
                }
            }
        }
        this.turn = { b: 1, w: 0 }[split[1]] ?? 1
        this.moveN = parseInt("0" + (split[5] ?? "1").replaceAll(/\D/g, ""))
        this.update(null, this.parseSquare(split[3]), split[2] ?? "KQkq")
        this.updateLegalMoves()
    }

    // Outputs a hash of the current board position
    toZobristHash() {
        let hash = [4294967296, 4294967296]
        for (let i = 0; i < 64; i++) hash[0] ^= HashTable[i * 12 + this.data[i] - 2], hash[1] ^= HashTable[i * 24 + this.data[i] - 2]
        return Math.abs((hash[0] * 4294967296) + hash[1])
    }

    // Algebraic notation parser
    parseMove(str) {
        // Remove all characters not necesary for getting the move
        // Replacing all 0 with O because some people use 0 to represent castling
        // No need for B (bishop) as that is covered by A to H and no need for P (pawn) as it is notated by nothing
        // O is needed for castling
        str = `${str}`.toLowerCase().replaceAll("0", "o").replaceAll(/[^a-h1-8kqrno]/g, "")
        // Need to check if the move is castling before as its notation is different
        if (str === "oo") { // King-side castling
            const square = this.turn === Colours.White ? 4 : 60
            return new Move(this, square, square + Offsets[3] * 2, Moves.Castling)
        }
        if (str === "ooo") { // Queen-side castling
            const square = this.turn === Colours.White ? 4 : 60
            return new Move(this, square, square + Offsets[2] * 2, Moves.Castling)
        }
        // Must be at least 2 characters long
        if (str.length < 2) return null

        if (str.match(/[qrbn]$/)) { // Promoting
            const endSquare = this.parseSquare(str.slice(-3, -1))
            let startSquare = endSquare + Offsets[this.turn]
            if (str.match(/[a-h]{2}/)) {
                if (str[0] !== str[1]) {

                }
            }
            return new Move(this, startSquare, endSquare, Moves.Promoting, { q: Pieces.Queen, r: Pieces.Rook, b: Pieces.Bishop, n: Pieces.Knight }[str[str.length - 1]])
        }

        console.log(str)
    }

    move(move, hidden) {
        for (let i = 0; i < this.legalMoves.length; i++) {
            if (move.id === this.legalMoves[i].id) {
                this.previousPosition = this.toFEN()
                this.legalMoves[i].do(this)
                if (!hidden) {
                    // Highlight the move
                    display.highlightedSquares = [this.legalMoves[i].square1, this.legalMoves[i].square2]
                    display.arrows = []
                    annotation = null
                    console.log(this.legalMoves[i].toAlgebraicNotation(this))
                }
                this.updateLegalMoves()
                this.updateGameState()
                return true
            }
        }
        return false
    }

    // Updates the board
    update(invert, enpassant, castling) {
        this.turn = + +!this.turn // Just a stupid way to toggle between 1 and 0
        this.updatePieceLocations()
        this.updateAttackedSquares()
        this.updatePinnedPieces()
        this.updateCheck()
        this.enpassant = enpassant
        if (castling) this.castling = castling
    }

    // Creates an array of all the attacked squares on the board
    updateAttackedSquares() {
        for (let c = 0; c < 2; c++) {
            this[c].Attacking = new Array(64).fill(null)
            this[c].Attacker = null
            for (let i = 0; i < this[c].Pieces.length; i++) {
                const square = this[c].Pieces[i]
                const piece = this.data[square] >> 1 << 1
                const movesToEdge = MovesToEdge[square]
                if (piece === Pieces.Pawn) {
                    // Set a piece diagonal to a pawn as attacked if the pawn is not on the edge of the board
                    if (c === Colours.White) {
                        if ((square) % 8 !== 0) {
                            this[c].Attacking[square + Offsets[4]]++
                            if (this[+ !c].KingLocation === square + Offsets[4]) this[c].Attacker = square
                        }
                        if ((square + 1) % 8 !== 0) {
                            this[c].Attacking[square + Offsets[6]]++
                            if (this[+ !c].KingLocation === square + Offsets[6]) this[c].Attacker = square
                        }
                    } else {
                        if ((square + 1) % 8 !== 0) {
                            this[c].Attacking[square + Offsets[5]]++
                            if (this[+ !c].KingLocation === square + Offsets[5]) this[c].Attacker = square
                        }
                        if ((square) % 8 !== 0) {
                            this[c].Attacking[square + Offsets[7]]++
                            if (this[+ !c].KingLocation === square + Offsets[7]) this[c].Attacker = square
                        }
                    }
                } else if (piece === Pieces.Knight) {
                    // Loop through all directions then loop through the offsets which are perpendicular to the original direction
                    for (let i = 0; i < 4; i++) {
                        if (movesToEdge[i] > 2) {
                            const dir2 = Offsets.slice(i < 2 ? 2 : 0, i < 2 ? 4 : 2)
                            for (let j = 0; j < 2; j++) {
                                const idx = square + Offsets[i] * 2 + dir2[j]
                                if (movesToEdge[(i < 2 ? 2 : 0) + j] > 1) {
                                    this[c].Attacking[idx]++
                                    if (this[+ !c].KingLocation === idx) this[c].Attacker = square
                                }
                            }
                        }
                    }
                } else {
                    // Loop through all 8 directions for sliding pieces, but only horizontally and vertically for rooks and diagonally for bishops
                    for (let i = (piece === Pieces.Bishop ? 4 : 0); i < (piece === Pieces.Rook ? 4 : 8); i++) {
                        for (let j = 1; j < movesToEdge[i]; j++) {
                            const idx = square + Offsets[i] * j
                            if (this.data[idx] != null) {
                                this[c].Attacking[idx]++
                                if (this[+ !c].KingLocation === idx) this[c].Attacker = square
                                if ((this.data[idx] & 1) === c) break
                                if (this.data[idx] !== Pieces.King + !c) {
                                    break
                                }
                            } else {
                                this[c].Attacking[idx]++
                                if (this[+ !c].KingLocation === idx) this[c].Attacker = square
                            }
                            if (piece === Pieces.King) break
                        }
                    }
                }
            }
        }
    }

    // Creates an array of pieces which are pinned to the king
    updatePinnedPieces() {
        for (let c = 0; c < 2; c++) {
            this[c].Pinned = new Array(64)
            this[c].BlockCheck = new Array(64)
            const kingLocation = this[c].KingLocation
            const movesToEdge = MovesToEdge[kingLocation]
            // Loop through all 8 directions and search from the edge of the board to the king if there is an enemy piece which can attack in that direction
            for (let i = 0; i < 8; i++) {
                let attacking = false
                let attackerLocation = null
                let blockingCount = 0
                for (let j = 1; j < movesToEdge[i]; j++) {
                    const idx = kingLocation + Offsets[i] * j
                    if (this.data[idx] != null) {
                        const piece = this.data[idx]
                        // If the opponent has a piece which can attack in the direction we are searching in, set attacking to true
                        if (piece === Pieces.Queen + !c) { attacking = true, attackerLocation = j; break }
                        else if (i > 3 && piece === Pieces.Bishop + !c) { attacking = true, attackerLocation = j; break }
                        else if (i < 4 && piece === Pieces.Rook + !c) { attacking = true, attackerLocation = j; break }
                        // Counting the number of "pinned" pieces
                        else {
                            blockingCount++
                        }
                    }
                }
                // If more than 1 piece is pinned then it's not truely a pin
                if (attacking) {
                    if (blockingCount === 1) { for (let j = attackerLocation; j > 0; j--) this[c].Pinned[kingLocation + Offsets[i] * j] = Math.abs(Offsets[i]) }
                    else if (blockingCount === 0 && !this[c].DoubleCheck) {
                        for (let j = attackerLocation; j > 0; j--) this[c].BlockCheck[kingLocation + Offsets[i] * j] = true
                    }
                }
            }
            if (this[+ !c].Attacker != null) this[c].BlockCheck[this[+ !c].Attacker] = true
        }
    }

    updateCheck() {
        // Checks if the king is on a square attacked by another colour
        for (let c = 0; c < 2; c++) {
            if (this[+ !c].Attacking[this[c].KingLocation]) this[c].Check = true; else this[c].Check = false
            if (this[+ !c].Attacking[this[c].KingLocation] > 1) this[c].DoubleCheck = true; else this[c].DoubleCheck = false
        }
    }

    updateGameState() {
        if (this.legalMoves.length === 0) {
            if (this[0].Check) {
                this.state = 1
                this.gameStateText = text.white.checkmate
            } else if (this[1].Check) {
                this.state = -1
                this.gameStateText = text.black.checkmate
            } else {
                this.state = 0
                this.gameStateText = text.draw.stalemate
            }
        } else {
            this.state = null
            this.gameStateText = ""
        }
    }

    updatePieceLocations() {
        this[0].Pieces = []
        this[1].Pieces = []
        for (let i = 0; i < 64; i++) {
            if (this.data[i] != null) {
                const colour = this.data[i] & 1
                this[colour].Pieces.push(i)
                if (this.data[i] >> 1 << 1 === Pieces.King) this[colour].KingLocation = i
            }
        }
    }

    updateLegalMoves() {
        this.legalMoves = []
        this.updatePieceLocations()
        this.updateAttackedSquares()
        this.updatePinnedPieces()
        for (let i = 0; i < this[this.turn].Pieces.length; i++) {
            const square = this[this.turn].Pieces[i]
            this.legalMoves.push(...this.getLegalMoves(square))
        }
    }

    getLegalMoves(square) {
        const colour = this.data[square] & 1
        const piece = this.data[square] >> 1 << 1
        if (this[colour].DoubleCheck && piece !== Pieces.King) return [] // If the king is in Double-Check, the only legal moves will be with the king
        let moves = []
        switch (piece) {
            case Pieces.King:
                moves = this.getSlidingMoves(square)
                if (!this[colour].Check) { // Making sure the king is not in check, as you can't castle out of check (saddly)
                    // Many nested if statements may be ugly, but it is more efficient than a massive if statement with lots of ands
                    if (colour === Colours.White) {
                        if (this.castling.includes("K")) { // Checking if we can castle king-side
                            if (this.data[7] === Pieces.Rook + Colours.White) { // Checking if the rook exists
                                // Making sure there are no pieces blocking and that the king isn't castling into or through check
                                if (this.data[5] == null && this.data[6] == null && !this[Colours.Black].Attacking[5] && !this[Colours.Black].Attacking[6]) moves.push(new Move(this, square, 6, Moves.Castling))
                            }
                        }
                        if (this.castling.includes("Q")) { // Checking if we can castle queen-side
                            if (this.data[0] === Pieces.Rook + Colours.White) {// Checking if the rook exists
                                // Making sure there are no pieces blocking and that the king isn't castling into or through check
                                if (this.data[1] == null && this.data[2] == null && this.data[3] == null && !this[Colours.Black].Attacking[2] && !this[Colours.Black].Attacking[3]) moves.push(new Move(this, square, 2, Moves.Castling))
                            }
                        }
                    } else {
                        if (this.castling.includes("k")) { // Checking if we can castle king-side
                            if (this.data[63] === Pieces.Rook + Colours.Black) { // Checking if the rook exists
                                // Making sure there are no pieces blocking and that the king isn't castling into or through check
                                if (this.data[61] == null && this.data[62] == null && !this[Colours.White].Attacking[61] && !this[Colours.White].Attacking[62]) moves.push(new Move(this, square, 62, Moves.Castling))
                            }
                        }
                        if (this.castling.includes("q")) { // Checking if we can castle queen-side
                            if (this.data[56] === Pieces.Rook + Colours.Black) { // Checking if the rook exists
                                // Making sure there are no pieces blocking and that the king isn't castling into or through check
                                if (this.data[57] == null && this.data[58] == null && this.data[59] == null && !this[Colours.White].Attacking[58] && !this[Colours.White].Attacking[59]) moves.push(new Move(this, square, 58, Moves.Castling))
                            }
                        }
                    }
                }
                break
            case Pieces.Queen:
                moves = this.getSlidingMoves(square)
                break
            case Pieces.Rook:
                moves = this.getSlidingMoves(square)
                break
            case Pieces.Bishop:
                moves = this.getSlidingMoves(square)
                break
            case Pieces.Knight:
                if (this[colour].Pinned[square]) break
                const movesToEdge = MovesToEdge[square]
                // Loop through all directions then loop through the offsets which are perpendicular to the original direction
                for (let i = 0; i < 4; i++) {
                    if (movesToEdge[i] > 2) {
                        const dir2 = Offsets.slice(i < 2 ? 2 : 0, i < 2 ? 4 : 2)
                        for (let j = 0; j < 2; j++) {
                            const idx = square + Offsets[i] * 2 + dir2[j]
                            if (movesToEdge[(i < 2 ? 2 : 0) + j] > 1) {
                                // If the king is in check, only allow moves that block the check or take the checking piece
                                if ((this[colour].Check && this[colour].BlockCheck[idx]) || !this[colour].Check) {
                                    if (this.data[idx] != null) {
                                        if (+ !(this.data[idx] & 1) === colour) moves.push(new Move(this, square, idx, Moves.Jump))
                                    } else moves.push(new Move(this, square, idx, Moves.Jump))
                                }
                            }
                        }
                    }
                }
                break
            case Pieces.Pawn:
                // If the square infront is empty, consider allowing it to move forwards
                if (this.data[square + Offsets[+ !colour]] == null) {
                    // Checking if the pawn is not pinned in a way that moving it would put the king in check
                    if (this[colour].Pinned[square] == null || this[colour].Pinned[square] === Offsets[0]) {
                        // Allow the pawn to move 1 square forwards or promote if it can
                        moves.push(...this.#promotion(square, square + Offsets[+ !colour], colour))
                        // If the pawn is on the 2nd and white or is on 7th and is black and the square 2 spaces infront is empty, allow it to move twice
                        if (((colour === Colours.White && square < 16) || (colour === Colours.Black && square > 47)) && this.data[square + Offsets[+ !colour] * 2] == null) {
                            // If the king is in check, only allow the move if it stops check
                            if ((this[colour].Check && this[colour].BlockCheck[square + Offsets[+ !colour] * 2]) || !this[colour].Check) {
                                moves.push(new Move(this, square, square + Offsets[+ !colour] * 2, Moves.DoublePawnMove))
                            }
                        }
                    }
                }
                // Checking if there is a piece that can be taken diagonally or if a pawn can be taken by EnPassant
                if ((this.data[square + Offsets[4 + !colour]] != null || this.enpassant === square + Offsets[4 + !colour]) && (square + !colour) % 8 !== 0) if ((this.data[square + Offsets[4 + !colour]] & 1) === + !colour || this.enpassant === square + Offsets[4 + !colour]) {
                    // Checking if the pawn is not pinned in a way that moving it would put the king in check
                    if (this[colour].Pinned[square] == null || this[colour].Pinned[square] === Offsets[4]) {
                        moves.push(...this.#promotion(square, square + Offsets[4 + !colour], colour))
                    }
                }
                // Checking if there is a piece that can be taken on the other diagonal or if a pawn can be taken by EnPassant
                if ((this.data[square + Offsets[6 + !colour]] != null || this.enpassant === square + Offsets[6 + !colour]) && (square + colour) % 8 !== 0) if ((this.data[square + Offsets[6 + !colour]] & 1) === + !colour || this.enpassant === square + Offsets[6 + !colour]) {
                    // Checking if the pawn is not pinned in a way that moving it would put the king in check
                    if (this[colour].Pinned[square] == null || this[colour].Pinned[square] === Offsets[6]) {
                        moves.push(...this.#promotion(square, square + Offsets[6 + !colour], colour))
                    }
                }
                break
        }

        return moves
    }

    #promotion(square1, square2, colour) {
        let moves = []
        // If the king is in check, only allow the move if it stops check
        if ((this[colour].Check && this[colour].BlockCheck[square2]) || !this[colour].Check || this.enpassant === square2) {
            // If the pawn's move is to the 8th rank and the pawn is white, allow it to promote or if the pawn's move is to the 1st rank and the pawn is black, allow it to promote
            if ((colour === Colours.White && square2 > 55) || (colour === Colours.Black && square2 < 8)) {
                for (const piece of [Pieces.Queen, Pieces.Rook, Pieces.Bishop, Pieces.Knight]) moves.push(new Move(this, square1, square2, Moves.Promoting, piece))
            } else {
                // Otherwise check if it can take by EnPassant, if not just make it move normally
                if (this.enpassant === square2) {
                    if (!this[colour].Check || (this[colour].Check && (this[colour].BlockCheck[square2] || this[+ !colour].Attacker === square2 + Offsets[colour]))) moves.push(new Move(this, square1, square2, Moves.EnPassant))
                } else {
                    moves.push(new Move(this, square1, square2, Moves.Slide))
                }
            }
        }
        return moves
    }

    getSlidingMoves(square) {
        const piece = this.data[square] >> 1 << 1 // Removing the last bit as it determines the colour
        const colour = this.data[square] & 1 // Setting the last bit as its own variable
        let moves = []
        const movesToEdge = MovesToEdge[square]
        // Loop through all 8 directions for sliding pieces, but only horizontally and vertically for rooks and diagonally for bishops
        for (let i = (piece === Pieces.Bishop ? 4 : 0); i < (piece === Pieces.Rook ? 4 : 8); i++) {
            // If the piece is pinned, limit its movement
            if (this[colour].Pinned[square] === Math.abs(Offsets[i]) || this[colour].Pinned[square] == null) {
                // Loop until we hit a piece or get to the edge
                for (let j = 1; j < movesToEdge[i]; j++) {
                    const idx = square + Offsets[i] * j
                    if (this.data[idx] != null) {
                        if ((this.data[idx] & 1) === colour) break // Break if the piece is the same colour as the piece we are generating moves for otherwise, add the move then break
                        if (piece === Pieces.King) if (this[+ !colour].Attacking[idx]) break // Don't allow the king to take a piece which is defended
                        // If the king is in check, only allow moves that block the check or take the checking pie
                        if ((this[colour].Check && this[colour].BlockCheck[idx]) || !this[colour].Check || piece === Pieces.King) moves.push(new Move(this, square, idx, Moves.Slide))
                        break
                    }
                    if (piece === Pieces.King) {
                        if (!this[+ !colour].Attacking[idx]) moves.push(new Move(this, square, idx, Moves.Slide))
                        break // Only allow the king to move one square
                    } else if ((this[colour].Check && this[colour].BlockCheck[idx]) || !this[colour].Check) {
                        // If the king is in check, only allow moves that block the check or take the checking pie
                        moves.push(new Move(this, square, idx, Moves.Slide))
                    }
                }
            }
        }
        return moves
    }

    // Converts the internally used ID of a square to a standard, human readable co-ordinate
    intSquareToString(square) {
        if (square == null) return "-"
        const rank = Math.floor(square / 8)
        const file = square - rank * 8
        return ["a", "b", "c", "d", "e", "f", "g", "h"][file] + (rank + 1)
    }

    // Converts the standard, human readable co-ordinate of a square to the internally used ID 
    parseSquare(square) {
        if (square == null) return null
        if (square === "-") return null
        if (square.length !== 2) return null
        square = square.toLowerCase()
        if (!square.match(/[a-h][1-8]/)) return null
        return { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 }[square[0]] + (parseInt(square[1]) - 1) * 8
    }

    eval() {
        let material = 0, positionalScore = 0
        for (let c = 0; c < 2; c++) {
            for (let i = 0; i < this[c].Pieces.length; i++) {
                const square = this[c].Pieces[i]
                const piece = this.data[square] >> 1 << 1
                const endgame = this[c].Pieces.length / 16
                // For every piece, add its' value multiplied by the colour of who's piece it is (1 for white, -1 for black) and add the value of its position 
                material += Value[piece] * (c * 2 - 1)
                positionalScore += PositionalScores[piece + c + (piece === Pieces.King ? (endgame < 0.5 ? 2 : 0) : 0)][square] * (c * 2 - 1)
            }
        }
        // Material score (value of all the pieces combined) plus the number of legal moves divided by 40 (to not encorage the AI to bring out the queen early)) plus 0.5 if the opponent is in check minus 0.5 if in check
        return material + (this.legalMoves.length / 40) + (positionalScore / 100) + (this[+ !this.turn].Check / 2) - (this[this.turn].Check / 2)
    }

    render() {
        const canvas = document?.getElementById("board") ?? Canvas.createCanvas()
        const ctx = canvas.getContext("2d")

        // Resetting variables
        let offsetX = 0
        let offsetY = 0
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight

        // Setting offset and canvas width depending on how many eval bars are on
        if (display.eval) {
            offsetX = canvas.width / 20
            canvas.width = canvas.clientWidth / 20 * 21
        }

        // Rounding cellX, cellY, offsetX and offsetY can produce a sharper board, but at the cost of potentially not filling the canvas
        const cellX = (canvas.width - offsetX) / 8
        const cellY = (canvas.height - offsetY) / 8

        // Calculating which square the mouse is over
        const selected = (Math.round((display.flip ? mouse.y - cellY / 2 : ((mouse.y - canvas.height + offsetY) * -1) - cellY / 2) / cellY)) * 8 + (Math.round((display.flip ? ((mouse.x - canvas.width + offsetX) * -1) - cellX / 2 : mouse.x - cellX / 2) / cellX))

        // Handling mouse updates
        if (mouse.acknowledged === false) {
            if (mouse.button === 1) {
                if (mouse.click === true && !mouse.picked) {
                    mouse.picked = this.data[selected]
                    mouse.previous = selected
                    moves = []
                    const pseudoLegal = this.getLegalMoves(selected)
                    const ids = []
                    for (let i in pseudoLegal) ids.push(pseudoLegal[i].id)
                    for (let i = 0; i < this.legalMoves.length; i++) {
                        if (ids.includes(this.legalMoves[i].id)) display.highlightedMoves.push(this.legalMoves[i].square2), moves.push(this.legalMoves[i])
                    }
                    this.data[selected] = null
                } else {
                    if (mouse.picked != null) {
                        display.arrows = []
                        display.highlightedSquares = []
                        this.data[mouse.previous] = mouse.picked
                        for (let i = 0; i < moves.length; i++) {
                            if (moves[i].square2 === selected) {
                                if (moves[i].type === Moves.Promoting) {
                                    if (moves[i].promotion === promoteTo) {
                                        this.move(moves[i])

                                        // Updating the annotations
                                        if (display.analysis) analyse(this, moves[i])
                                        break
                                    }
                                } else {
                                    this.move(moves[i])

                                    // Updating the annotations
                                    if (display.analysis) analyse(this, moves[i])
                                    break
                                }
                            }
                        }
                    }
                    mouse.picked = null
                    display.highlightedMoves = []
                }
            } else if (mouse.button === 3) {
                if (mouse.click === true) {
                    mouse.highlightStart = selected
                } else {
                    if (mouse.highlightStart === selected) {
                        if (display.highlightedSquares.includes(selected)) display.highlightedSquares = display.highlightedSquares.filter(e => e !== selected); else display.highlightedSquares.push(selected)
                    } else {
                        let broke
                        for (let i = 0; i < display.arrows.length; i++) {
                            if (display.arrows[i].square1 === mouse.highlightStart && display.arrows[i].square2 === selected) {
                                display.arrows.splice(i, 1)
                                broke = true
                                break
                            }
                        }
                        if (!broke) {
                            display.arrows.push({ square1: mouse.highlightStart, square2: selected })
                        }
                    }
                }
            }
            mouse.acknowledged = true
        }

        // Changing the cursor
        if (mouse.picked != null) document.body.style.cursor = "grabbing"
        else if (this.data[selected] != null && mouse.overBoard) document.body.style.cursor = "grab"
        else document.body.style.cursor = "default"

        // Drawing the board
        let x = 0, y = 9
        if (display.flip == true) x = 9, y = 0
        for (let rank = 1; rank <= 8; rank++) {
            if (display.flip == true) y++, x = 9; else y--, x = 0
            for (let file = 1; file <= 8; file++) {
                if (display.flip == true) x--; else x++
                const fileLetter = ["a", "b", "c", "d", "e", "f", "g", "h"][file - 1]
                const rankNumber = rank + ""
                const idx = (rank - 1) * 8 + (file - 1)
                const piece = this.data[idx]

                ctx.fillStyle = (file + rank) % 2 ? styles.white : styles.black
                ctx.fillRect(cellX * x - cellX + offsetX, cellY * y - cellY + offsetY, cellX, cellY)
                ctx.font = `${cellY / 4}px ${styles.font}`
                ctx.lineWidth = Math.min(cellX, cellY) / 16

                // Drawing the file letters and rank numbers
                ctx.fillStyle = (file + rank) % 2 ? styles.black : styles.white // Setting the colour to the opposite of the tile colour
                if (y === 8) ctx.fillText(fileLetter, cellX * x - cellX * 0.17 + offsetX, cellY * y - cellY * 0.08 + offsetY)
                if (x === 1) ctx.fillText(rankNumber, cellX * x - cellX * 0.95 + offsetX, cellY * y - cellY * 0.75 + offsetY)


                // Drawing the glow behind the king if he is in check
                if ((idx === this[0].KingLocation && this[0].Check) || (idx === this[1].KingLocation && this[1].Check)) {
                    ctx.save()
                    ctx.shadowBlur = Math.min(cellX, cellY) * 0.5
                    ctx.shadowColor = styles.checkIndicator
                    ctx.shadowOffsetX = -canvas.width
                    ctx.fillRect(cellX * x - cellX * 0.75 + canvas.width + offsetX, cellY * y - cellY * 0.75 + offsetY, cellX * 0.5, cellY * 0.5)
                    ctx.restore()
                }

                // Highlighting the previous move
                if (display.highlightedSquares.includes(idx)) {
                    ctx.fillStyle = styles.moveHighlight
                    ctx.fillRect(cellX * x - cellX + offsetX, cellY * y - cellY + offsetY, cellX, cellY)
                }

                // Highlighting possible move squares
                if (display.highlightedMoves.includes(idx)) {
                    ctx.fillStyle = styles.availableMovesHighlight
                    ctx.beginPath()
                    if (this.data[idx] == null || this.data[idx] === "") ctx.arc(cellX * x - cellX / 2 + offsetX, cellY * y - cellY / 2 + offsetY, Math.min(cellX, cellY) / 6, 0, 2 * Math.PI)
                    else ctx.arc(cellX * x - cellX / 2 + offsetX, cellY * y - cellY / 2 + offsetY, Math.min(cellX, cellY) / 2.5, 0, 2 * Math.PI)
                    ctx.fill()
                }

                // Highlighting the square which the mouse is over
                if (selected === idx && mouse.picked != null) {
                    ctx.strokeStyle = styles.moveHighlight
                    ctx.strokeRect(cellX * x - cellX + cellX / 32 + offsetX, cellY * y - cellY + cellY / 32 + offsetY, cellX - cellX / 16, cellY - cellY / 16)
                }

                // If debug mode is enabled, draw the internal square number and draw all how many pieces attack each square
                if (display.debug) {
                    ctx.fillStyle = styles.debug
                    ctx.fillText(idx + "", cellX * x - cellX * 0.3 + offsetX, cellY * y - cellY * 0.75 + offsetY)
                    if (this[this.turn].Attacking[idx]) ctx.fillRect(cellX * x + offsetX - cellX / 4, cellY * y + offsetY - cellY / 4, cellX / 4, cellY / 4)
                    let count = 0
                    for (let move in this.legalMoves) {
                        if (this.legalMoves[move].square2 === idx) count++
                    }
                    if (count !== 0) ctx.fillText(count + "", cellX * x - cellX * 0.7 + offsetX, cellY * y - cellY * 0.3 + offsetY)
                }

                // Drawing the pieces
                if (piece != null) ctx.drawImage(styles.pieces, (6 - (piece >> 1)) * styles.pieceSizeX, (piece & 1) === Colours.White ? 0 : styles.pieceSizeY, styles.pieceSizeX, styles.pieceSizeY, cellX * x - cellX + offsetX, cellY * y - cellY + offsetY, cellX, cellY)

                // Drawing the annotation
                if (display.analysis) {
                    if (annotation?.square === idx) {
                        ctx.save()
                        ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = Math.min(cellX, cellY) / 16
                        ctx.shadowColor = styles.shadow
                        ctx.drawImage(styles.annotations, annotation.annotation * styles.annotationSizeX, 0, styles.annotationSizeX, styles.annotationSizeY, cellX * x + offsetX - cellX / 3 - cellX / 16, cellY * (y - 1) + offsetY + cellY / 16, cellX / 3, cellY / 3)
                        ctx.restore()
                    }
                }
            }
        }

        // Drawing arrows
        if (display.arrows.length > 0) {
            ctx.save()
            ctx.fillStyle = styles.arrows
            ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = Math.min(cellX, cellY) / 16
            ctx.shadowColor = styles.shadow
            const width = Math.min(cellX, cellY) / 4
            ctx.beginPath()
            for (const arrow of display.arrows) {
                const rank1 = Math.floor(arrow.square1 / 8)
                const file1 = arrow.square1 - rank1 * 8
                const rank2 = Math.floor(arrow.square2 / 8)
                const file2 = arrow.square2 - rank2 * 8
                let x1 = (display.flip ? 7 - file1 : file1) * cellX + cellX / 2 + offsetX
                const x2 = (display.flip ? 7 - file2 : file2) * cellX + cellX / 2 + offsetX
                let y1 = (display.flip ? rank1 : 7 - rank1) * cellY + cellX / 2 + offsetY
                const y2 = (display.flip ? rank2 : 7 - rank2) * cellY + cellX / 2 + offsetY
                if ((Math.abs(file2 - file1) === 2 && Math.abs(rank2 - rank1) === 1) || (Math.abs(rank2 - rank1) === 2 && Math.abs(file2 - file1) === 1)) {
                    // Knight arrow
                    // Just draw a rectangle and another arrow
                    const rx2 = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? x2 : x1
                    const ry2 = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? y1 : y2
                    const angle2 = Math.atan2(ry2 - y1, rx2 - x1)
                    ctx.moveTo(x1 + width * Math.cos(angle2 + 0.7853981633974483), y1 + width * Math.sin(angle2 + 0.7853981633974483)) // 45deg
                    ctx.lineTo(rx2 + width * Math.cos(angle2 + 0.7853981633974483), ry2 + width * Math.sin(angle2 + 0.7853981633974483)) // 45deg
                    ctx.lineTo(rx2 + width * Math.cos(angle2 - 0.7853981633974483), ry2 + width * Math.sin(angle2 - 0.7853981633974483)) // 45deg
                    ctx.lineTo(x1 + width * Math.cos(angle2 - 0.7853981633974483), y1 + width * Math.sin(angle2 - 0.7853981633974483)) // 45deg
                    if (Math.abs(y2 - y1) < Math.abs(x2 - x1)) x1 = x2; else y1 = y2
                }
                // Straight arrow
                const angle = Math.atan2(y2 - y1, x2 - x1)
                const offsetC = width * Math.cos(angle + Math.PI)
                const offsetS = width * Math.sin(angle + Math.PI)
                ctx.moveTo(x1 + width * Math.cos(angle + 0.7853981633974483), y1 + width * Math.sin(angle + 0.7853981633974483)) // 45deg
                ctx.lineTo(x2 + width * Math.cos(angle + 0.7853981633974483) + 2 * offsetC, y2 + width * Math.sin(angle + 0.7853981633974483) + 2 * offsetS) // 45deg
                ctx.lineTo(x2 + 1.5 * width * Math.cos(angle + 1.5707963267948966) + 1.3 * offsetC, y2 + 1.5 * width * Math.sin(angle + 1.5707963267948966) + 1.3 * offsetS) // 90deg
                ctx.lineTo(x2, y2)
                ctx.lineTo(x2 + 1.5 * width * Math.cos(angle - 1.5707963267948966) + 1.3 * offsetC, y2 + 1.5 * width * Math.sin(angle - 1.5707963267948966) + 1.3 * offsetS) // 90deg
                ctx.lineTo(x2 + width * Math.cos(angle - 0.7853981633974483) + 2 * offsetC, y2 + width * Math.sin(angle - 0.7853981633974483) + 2 * offsetS) // 45deg
                ctx.lineTo(x1 + width * Math.cos(angle - 0.7853981633974483), y1 + width * Math.sin(angle - 0.7853981633974483)) // 45deg
            }
            ctx.fill()
            ctx.restore()
        }

        // Drawing any piece being dragged by the mouse
        if (mouse.picked != null) {
            ctx.save()
            ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = Math.min(cellX, cellY) / 16
            ctx.shadowColor = styles.shadow
            ctx.drawImage(styles.pieces, (6 - (mouse.picked >> 1)) * styles.pieceSizeX, (mouse.picked & 1) === Colours.White ? 0 : styles.pieceSizeY, styles.pieceSizeX, styles.pieceSizeY, mouse.x - cellX * 0.5, mouse.y - cellY * 0.5, cellX, cellY)
            ctx.restore()
        }

        // Drawing the eval bar
        if (display.eval) {
            evalBar = Math.round(canvas.height / 2 * 0.9 * boardEval / 10)
            if (boardEval > 10) evalBar = Math.round(canvas.height / 2 * 0.9)
            else if (boardEval < -10) evalBar = Math.round(canvas.height / 2 * -0.9)

            // Converting the evaluation to a string with a maximum of 3 characters of length so that the evaluation doesn't get unreadably small
            let evalStr = (Math.abs(Math.round(boardEval * 10) / 10) + "").slice(0, 3)
            if (evalStr.endsWith(".")) evalStr = evalStr.replace(".", "")
            if (Math.abs(boardEval) >= 10000) {
                const mateIn = Math.ceil(Math.floor((Math.abs(boardEval) / 1) % 10) / 2)
                evalStr = "M" + mateIn
                evalBar = canvas.height / 2 * Math.pow(boardEval, 1)
            }

            // Checking if it's a draw
            if (this.state === 0) {
                evalStr = "½-½"
                evalBar = 0
            }

            // Checking if a side won
            if (this.state) {
                evalStr = this.state === 1 ? "1-0" : "0-1"
            }

            // Drawing the black background then drawing the white eval bar over it
            ctx.fillStyle = styles.evalBlack
            ctx.fillRect(0, 0, offsetX, canvas.height)
            ctx.fillStyle = styles.evalWhite
            ctx.fillRect(0, display.flip ? 0 : canvas.height, offsetX, display.flip ? canvas.height / 2 + evalBar : -canvas.height / 2 - evalBar)

            // Setting the width of the text
            const width = offsetX - offsetX / 16

            // Measuring the text and calculating the correct size
            let measure = ctx.measureText(evalStr.padStart(3, "0"))
            let textData = { height: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent, width: measure.width }
            textData.ratio = textData.width / textData.height
            ctx.font = `${width / textData.ratio}px Consolas`

            // Measuring the scaled text and updating the height and width of the text, as it is needed to draw the text centred
            measure = ctx.measureText(evalStr)
            textData = { height: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent, width: measure.width }

            // If the eval is in white's favour, make the text black as the text will be placed on white's portion of the eval bar, otherwise make it white as it will be placed on the black portion of the eval bar
            ctx.fillStyle = boardEval > 0 ? styles.evalBlack : styles.evalWhite
            // XOR if the board is flipped with who's favour the eval bar is in to get which side of the eval bar to write the text
            ctx.fillText(evalStr, offsetX / 32 + (width - textData.width) / 2, (display.flip ^ (boardEval > 0) ? canvas.height - canvas.height / 40 + textData.height : canvas.height / 40))
        }
    }
}

if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
    // huzzah! a worker!
    onmessage = function (e) {
        const board = new Board(e.data.fen)
        const moves = []
        transpositions.clear()
        const limit = performance.now() - e.data.start + (e.data.timeLimit ?? Infinity)
        for (const obj of e.data.moves) moves.push(new Move(board, obj.square1, obj.square2, obj.type, obj.promotion))
        options.minMaxDepth = e.data.depth
        let alpha = -Infinity, beta = Infinity
        positionCount = 0
        const t1 = performance.now()
        if (board.turn === Colours.Black) {
            bestScore = Infinity
            for (let i = 0; i < moves.length; i++) {
                let score
                moves[i].do(board)
                board.updateLegalMoves()
                board.updateGameState()
                score = MiniMaxAB(board, limit, [...board.legalMoves], alpha, beta, options.minMaxDepth - 1, true)
                moves[i].undo(board)
                beta = Math.min(beta, score)
                moves[i].score = score
                if (limit < performance.now()) return postMessage({ aborted: true, i: e.data.i, positions: positionCount })
            }
        } else if (board.turn === Colours.White) {
            bestScore = -Infinity
            for (let i = 0; i < moves.length; i++) {
                let score
                moves[i].do(board)
                board.updateLegalMoves()
                board.updateGameState()
                score = MiniMaxAB(board, limit, [...board.legalMoves], alpha, beta, options.minMaxDepth - 1, false)
                moves[i].undo(board)
                alpha = Math.max(alpha, score)
                moves[i].score = score
                if (limit < performance.now()) return postMessage({ aborted: true, i: e.data.i, positions: positionCount })
            }
        }
        const time = Math.round(performance.now() - t1)
        postMessage({ time, positions: positionCount, moves, i: e.data.i })
    }
} else {
    if (document) {
        // This is a browser environment
        const canvas = document.getElementById("board")
        const gameStatus = document.getElementById("status")

        const loadedAssets = {
            Annotations: false,
            Pieces: false,
            Book: false,
            Workers: false
        }

        styles.annotations = new Image()
        styles.annotations.src = "/annotations.png"
        styles.annotations.onload = function () {
            // Setting the width and height of the pieces in the image
            styles.annotationSizeX = styles.annotations.width / 11
            styles.annotationSizeY = styles.annotations.height / 2
            loadedAssets.Annotations = true
            loaded()
        }
        styles.annotations.onerror = function (e) {
            new Notif(e, "e", true)
        }
        styles.pieces = new Image()
        styles.pieces.src = "/chess.png"
        styles.pieces.onload = function () {
            // Setting the width and height of the pieces in the image
            styles.pieceSizeX = styles.pieces.width / 6
            styles.pieceSizeY = styles.pieces.height / 2
            loadedAssets.Pieces = true
            loaded()
        }
        styles.pieces.onerror = function (e) {
            new Notif(e, "e", true)
        }

        fetch("/chessEvenBetter.js")
            .then(res => {
                res.text()
                    .then(text => {
                        code = URL.createObjectURL(new Blob([text], { type: "text/javascript" }))
                        loadedAssets.Workers = true
                        loaded()
                    })
                    .catch(e => {
                        new Notif(e, "e", true)
                    })
            })
            .catch(e => {
                new Notif(e, "e", true)
            })

        fetch("/book.bin")
            .then(res => {
                res.text()
                    .then(bin => {
                        loadBook(bin)
                        loadedAssets.Book = true
                        loaded()
                    })
                    .catch(e => {
                        new Notif(e, "e", true)
                    })
            })
            .catch(e => {
                new Notif(e, "e", true)
            })

        function loaded() {
            for (const resource in loadedAssets) if (loadedAssets[resource] === false) return; else if (loadedAssets[resource]) { console.log("Loaded " + resource + "!"), loadedAssets[resource] = null }

            boardTemp = new Board()
            loop(boardTemp)
        }

        function loop(board, wait = 2) {
            board.render()
            if (!thinking && wait > 1) {
                if (options.white.computer && board.turn === Colours.White) {
                    computerWorkers(board, options.white.timeLimit, options.white.minDepth, options.white.depthLimit)
                }
                if (options.black.computer && board.turn === Colours.Black) {
                    computerWorkers(board, options.black.timeLimit, options.black.minDepth, options.black.depthLimit)
                }
                wait = 0
            } else if (!thinking) wait++

            // Displaying game state
            gameStatus.innerHTML = board.gameStateText

            window.requestAnimationFrame(() => { loop(board, wait) })
        }

        // Set variables and add event listeners for the main thread
        document.addEventListener("pointermove", e => {
            const bounds = canvas.getBoundingClientRect()

            const x = e.clientX - bounds.left
            const y = e.clientY - bounds.top

            mouse.x = Math.max(Math.min(x, bounds.right - bounds.left), 0)
            mouse.y = Math.max(Math.min(y, bounds.bottom - bounds.top), 0)

            mouse.overBoard = e.target.id === "board"
        })

        canvas.addEventListener("touchmove", e => {
            e.preventDefault()
        })

        canvas.addEventListener("pointerdown", e => {
            if (e.which !== 1 && e.which !== 3) return
            e.preventDefault()
            mouse.button = e.which
            mouse.click = true
            mouse.acknowledged = false
        })

        canvas.addEventListener("pointerup", e => {
            mouse.click = false
            mouse.acknowledged = false
        })
    } else {
        // This is running on Node.js
    }
}

// Test FEN strings
// "k7/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
// "rnbqkbnr/pppppppp/8/8/8/8/8/7K w KQkq - 0 1"
// "k7/8/1Q b"
// "qrbnk3/4p3/8/8/8/8/3P4/3KNBRQ w"

// MiniMax Algorythm with Alpha-Beta pruning
function MiniMaxAB(board, limit, moves, alpha, beta, depth, maxer) {
    positionCount++
    const hash = board.toZobristHash()
    if (transpositions.has(hash)) return transpositions.get(hash)
    if (board.state != null) {
        // Have to times it by depth to give checkmates found earlier a higher score, so that if there is mate in many ways it actually mates instead of repeating moves to get a slower mate
        return board.state * 10000 * depth + (options.minMaxDepth - depth) * board.state
    }
    if (depth === 0) return board.eval()
    let score
    if (maxer) {
        score = -Infinity
        for (let i = 0; i < moves.length; i++) {
            if (limit < performance.now()) return 0
            moves[i].do(board)
            board.updateLegalMoves()
            board.updateGameState()
            score = Math.max(score, MiniMaxAB(board, limit, board.legalMoves, alpha, beta, depth - 1, false))
            moves[i].undo(board)
            if (score >= beta) break // Cut off the branch because it is worse than existing branches
            alpha = Math.max(alpha, score)
        }
    } else {
        score = Infinity
        for (let i = 0; i < moves.length; i++) {
            if (limit < performance.now()) return 0
            moves[i].do(board)
            board.updateLegalMoves()
            board.updateGameState()
            score = Math.min(score, MiniMaxAB(board, limit, board.legalMoves, alpha, beta, depth - 1, true))
            moves[i].undo(board)
            if (score <= alpha) break // Cut off the branch because it is worse than existing branches
            beta = Math.min(beta, score)
        }
    }
    transpositions.set(hash)
    return score
}

async function computerWorkers(board, timeLimit = 3000, minDepth, depthLimit, start, silent, ordered) {
    if (board.legalMoves.length === 0 || board.state != null) return null
    return new Promise((res) => {
        if (!silent) thinking = true
        if (!start) start = performance.now()
        const hash = board.toZobristHash()
        if (book.has(hash)) {
            const moves = book.get(hash).map(m => new Move(board, m))
            const move = moves[0]
            const time = Math.round(performance.now() - start)
            if (!silent) {
                board.move(move)
                if (display.analysis) analyse(board, move, moves); else thinking = false
            }
            return res({ move, boardEval: 0, time, positions: 0, ordered: moves })
        }
        let depth
        if (timeLimit) depth = minDepth ?? depthLimit ?? 3; else depth = depthLimit ?? 5
        let moves = ordered ?? orderMoves(board, board.legalMoves)
        const computed = []
        let completed = 0
        let positions = 0
        const fen = board.toFEN()
        for (let i = 0; i < options.workersLimit; i++) {
            let workerMoves = moves.slice((moves.length / options.workersLimit) * i, (moves.length / options.workersLimit) * (i + 1))
            if (!workers[i]) workers[i] = new Worker(code)
            workers[i].postMessage({ fen, moves: workerMoves, depth, timeLimit: (minDepth < depth ? timeLimit : null), start: performance.now() - start, i })
            workers[i].onmessage = function (e) {
                completed++
                positions += e.data.positions
                if (e.data.aborted) {
                    return res({ aborted: true, positions, time: Math.round(performance.now() - start) })
                } else {
                    for (const obj of e.data.moves) {
                        const move = new Move(board, obj.square1, obj.square2, obj.type, obj.promotion, obj.nextMove)
                        move.score = obj.score
                        computed.push(move)
                    }
                }
                if (completed >= options.workersLimit) {
                    let time = Math.round(performance.now() - start)
                    let ordered = computed.sort((a, b) => a.score - b.score)
                    if (board.turn === Colours.White) ordered = ordered.reverse()
                    const move = ordered[0]
                    if (start + (timeLimit ?? Infinity) > performance.now()) {
                        depth++
                        if (board.legalMoves.length > 0 && !e.data.aborted && thinking) {
                            return computerWorkers(board, timeLimit, null, depth, start, silent, ordered).then(results => {
                                if (!thinking) return res(null)
                                if (results.aborted) {
                                    positions += results.positions
                                    depth--
                                    if (!silent) {
                                        if (move) board.move(move)
                                        if (display.analysis) analyse(board, move, ordered); else thinking = false
                                    }
                                    const lines = ordered.slice(0, 3)
                                    const bestScore = boardEval = move.score
                                    updateInfo(board, bestScore, lines, positions, results.time, depth)
                                    return res({ move, boardEval, time: results.time, positions, ordered })
                                } else {
                                    return res(results)
                                }
                            })
                        } else {
                            depth--
                            if (!silent) {
                                if (move) board.move(move)
                                if (display.analysis) analyse(board, move, ordered); else thinking = false
                            }
                            const lines = ordered.slice(0, 3)
                            const bestScore = boardEval = move?.score
                            updateInfo(board, bestScore, lines, positions, time, depth)
                            return res({ move, boardEval, time, positions, ordered })
                        }
                    } else {
                        if (!silent) {
                            if (move) board.move(move)
                            if (display.analysis) analyse(board, move, ordered); else thinking = false
                        }
                        const lines = ordered.slice(0, 3)
                        const bestScore = boardEval = move?.score
                        updateInfo(board, bestScore, lines, positions, time, depth)
                        return res({ move, boardEval, time, positions, ordered })
                    }
                }
            }
        }
    })
}

async function analyse(board, move, ordered) {
    const oldState = thinking
    thinking = true
    fen = board.previousPosition
    const analysisBoard = new Board(fen)
    if (fen !== board.previousPosition) return thinking = oldState
    let square = move.square2
    let symbol = null
    let turn = analysisBoard.turn * 2 - 1
    let bestScore
    let rank
    if (!ordered) {
        thinking = true
        ordered = (await computerWorkers(analysisBoard, undefined, undefined, undefined, undefined, true)).ordered
    }
    for (let i = 0; i < ordered.length; i++) {
        if (move.id === ordered[i].id) {
            move = ordered[i]
            bestScore = ordered[0].score
            rank = i
            break
        }
    }
    // Difference between the score of the move played, and the best move. The higher the number, the worse the move
    const scoreDiff = (bestScore - move.score) * turn
    if (scoreDiff < 0.5) symbol = Annotations.Good
    if (scoreDiff >= 0.5) symbol = Annotations.Inaccurate
    if (scoreDiff > 0.9) symbol = Annotations.Mistake
    if (scoreDiff > 2.5) symbol = Annotations.Blunder
    if (scoreDiff === 0) symbol = Annotations.Best
    if (ordered[1]?.score) if ((ordered[1]?.score - bestScore) > 2) symbol = rank === 0 ? Annotations.Great : Annotations.Miss
    if ((book.get(analysisBoard.toZobristHash()) ?? []).includes(move.toInt())) symbol = Annotations.Book
    if (analysisBoard.legalMoves.length === 1) symbol = Annotations.Forced
    annotation = { annotation: symbol, square }
    display.arrows = []
    if (ordered[0]) display.arrows.push({ square1: ordered[0].square1, square2: ordered[0].square2 })
    if (ordered[1]) display.arrows.push({ square1: ordered[1].square1, square2: ordered[1].square2 })
    if (ordered[2]) display.arrows.push({ square1: ordered[2].square1, square2: ordered[2].square2 })
    thinking = false
    return annotation
}

function updateInfo(board, bestScore, lines, positions, time, depth) {
    document.getElementById("qEval").innerText = Math.round(board.eval() * 1000) / 1000
    document.getElementById("boardEval").innerText = Math.round(bestScore * 1000) / 1000
    document.getElementById("depth").innerText = depth
    document.getElementById("performance").innerText = `${(positions ?? 0).toLocaleString("en")} positions in ${time ?? "? "}ms (${Math.round(((positions ?? 0) / (time ?? 1)) * 1000).toLocaleString("en")} positions / sec)`
    boardEval = bestScore
    if (lines) {
        const linesElm = document.getElementById("lines")
        linesElm.innerHTML = ""
        for (let j = 0; j < lines.length; j++) {
            let line = ""
            let move = lines[j]
            while (move) {
                line += move.toAlgebraicNotation(board) + " "
                move = move.nextMove
            }
            linesElm.innerText += `${j + 1}) ${lines[j] ? Math.round(lines[j].score * 1000) / 1000 : ""} ${line}\n`
        }
    }
}

function test(board) {
    if (!board) board = boardTemp
    let i = 1
    const t1 = performance.now()
    for (const test of tests) {
        board.fromFEN(test.fen)
        const positions = countPositions(board, test.depth)
        const difference = positions - test.nodes
        console.log(`Test ${i++}:\n\tFEN: ${test.fen}\n\tDepth: ${test.depth}\n\tPositions: ${positions}\n\tExpected: ${test.nodes} (${difference > 0 ? "+" : ""}${difference}) ${difference === 0 ? "✅" : "❌"}`)
    }
    console.log(`Test completed in ${Math.round(performance.now() - t1)}ms!`)
}

async function perfTest(fen, time = 5000, repeat = 5) {
    const board = new Board(fen)
    const t1 = performance.now() + repeat * 100
    let positions = 0
    for (let i = 0; i < repeat; i++) {
        const res = await computerWorkers(board, time, undefined, undefined, undefined, true)
        await new Promise((res) => { setTimeout(res, 100) })
        positions += res.positions
        console.log(`${(res.positions).toLocaleString("en")} positions in ${res.time}ms (${Math.round(((res.positions) / (res.time)) * 1000).toLocaleString("en")} positions / sec)`)
    }
    const total = Math.round(performance.now() - t1)
    console.log(`${(positions).toLocaleString("en")} positions in ${total}ms (${Math.round(((positions) / (total)) * 1000).toLocaleString("en")} positions / sec)`)
}

function compareTest(stockfish, board) {
    stockfish = stockfish.split("\n")
    board = board.split("\n")
    const correct = {}
    stockfish.forEach(r => {
        const move = r.split(":")[0]
        const value = parseInt(r.split(":")[1])
        correct[move] = value
    })
    board.forEach(r => {
        const move = r.split(":")[0]
        const value = parseInt(r.split(":")[1])
        if (!correct[move]) {
            console.log(`!! Illegal !!  Move: ${move}`)
        } else {
            if (correct[move] !== value) console.log(`Move: ${move}, Result: ${value}, Expected: ${correct[move]} (${value - correct[move] > 0 ? "+" : ""}${value - correct[move]})`)
        }
        delete correct[move]
    })
    for (let i in correct) console.log(`!! Missing !!  Move: ${i}`)
    console.log(correct)
}

function countPositions(board, depth, log) {
    if (depth === 0) return 1
    let positionsCount = 0, logged = ""
    board.legalMoves.forEach(move => {
        move.do(board)
        board.updateLegalMoves()
        board.updateGameState()
        const movePositions = countPositions(board, depth - 1)
        if (log) logged += `${board.intSquareToString(move.square1)}${board.intSquareToString(move.square2)}${{ 4: "n", 6: "b", 8: "r", 10: "q" }[move.promotion] ?? ""}: ${movePositions}\n`
        positionsCount += movePositions
        move.undo(board)
    })
    if (log) console.log(logged)
    return positionsCount
}

function addToBook(square1, square2) {
    let board = boardTemp
    let moves = book.get(board.toZobristHash()) ?? []
    moves.push(parseInt(board.parseSquare(square1) + "" + board.parseSquare(square2)))
    book.set(board.toZobristHash(), moves)
}

function saveBook(download) {
    const byteArray = []
    const arr = Array.from(book)
    let idx = 0
    for (let i = 0; i < arr.length; i++) {
        writeBytes(arr[i][0], 8, idx)
        byteArray[idx + 8] = Math.min(255, arr[i][1].length)
        idx += 9
        arr[i][1] = arr[i][1].filter(a => (typeof a === "number") && (a !== 4))
        for (let j = 0; j < arr[i][1].length; j++) {
            writeBytes(arr[i][1][j], 2, idx + j * 2)
        }
        idx += arr[i][1].length * 2
    }
    const uint = new Uint8Array(byteArray)
    let json = JSON.stringify(arr)
    let bin = ""
    for (let i = 0; i < uint.length; i++) {
        bin += String.fromCharCode(uint[i])
    }
    console.log('"' + bin + '"', bin.length)
    console.log('"' + json + '"', json.length)
    console.log(uint)

    if (download) {
        const url = window.URL.createObjectURL(new Blob([bin]))
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = "book.bin"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
    }

    function writeBytes(n, bytes, idx) {
        for (let i = 0; i < bytes; i++) {
            const byte = n & 0xff
            byteArray[idx + i] = byte
            n = (n - byte) / 256
        }
    }
}

function loadBook(bin) {
    const byteArray = Uint8Array.from([...bin].map(ch => ch.charCodeAt()))
    let idx = i = 0
    const arr = []
    while (i + 9 < byteArray.length) {
        const count = byteArray[i + 8] * 2
        if (count > 0) {
            arr[idx] = [concatBytes(8, i), []]
            for (let m = 0; m < count; m += 2) {
                arr[idx][1].push(concatBytes(2, i + 9 + m))
            }
            idx++
        }
        i += 9 + count
    }
    book = new Map(arr)


    function concatBytes(bytes, idx) {
        let int = 0
        for (let i = bytes - 1; i >= 0; i--) {
            int = (int * 256) + byteArray[idx + i]
        }
        return int
    }
}

function parseMoves(str) {
    const arr = str.match(/([0-9]\.{1,2} ([^\W]*))/g)
    const hash = boardTemp.toZobristHash()
    const moves = book.get(hash)
    arr.forEach(move => {
        const int = new Move(boardTemp, move.split(" ")[1]).toInt()
        if (!moves.includes(int)) moves.push(int)
    })
    console.log(arr, moves)
    book.set(hash, moves)
}

// Ordering moves so that likely to be good moves get searched earlier to prune more branches
function orderMoves(board, moves) {
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i]
        let score = 0

        if (board.data[move.square2] != null) { // The move captures the opponents piece
            score += (Value[board.data[move.square2]] - Value[move.piece]) * 100 // Capturing a piece with a less valuable piece is often good
        }

        if (move.type === Moves.Promoting) score += Value[move.promotion] // Promoting a pawn is often good
        else if (move.type === Moves.Castling) score += 100 // Castling is often good

        if (move.piece === Pieces.Pawn) score += 50 // Pushing pawns is sometimes good

        if (board[+ !board.turn].Attacking[move.square2]) score -= Value[move.piece] * 100 * board[+ !board.turn].Attacking[move.square2] // Moving to an attacked square is often bad

        moves[i].score = score
    }
    // Sort the moves, highest score to lowest score
    return moves.sort((a, b) => a.score - b.score)
}

// Seedable random number generator
function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
