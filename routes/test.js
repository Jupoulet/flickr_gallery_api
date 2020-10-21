let arr = [
    { id: 1, data: {}},
    { id: 4, data: {}},
    { id: 2, data: {}},
    { id: 3, data: {}},
    { id: 5, data: { file: 20200403002 }},
    { id: 8, data: { file: 20200403001 }},
    { id: 6, data: { file: 20200403003 }},
    { id: 7, data: { file: 20200303002 }}
]

// let firstSort = [...arr].filter(p => !p.data.file).sort((a, b) => a.id - b.id)
// let secondSort = [...arr].filter(p=> p.data.file).sort((a, b) => a.data.file - b.data.file)

// let finalArray = [
//     ...firstSort,
//     ...secondSort
// ]

let index = arr.map(e => e.id).indexOf(4);

console.log('RESULT', {
    index
})