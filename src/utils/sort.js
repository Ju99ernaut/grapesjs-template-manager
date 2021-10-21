// https://github.com/netlify-labs/oauth-example/blob/master/src/utils/sort.js
// License MIT
import objSize from './objsize';

export function matchText(search, text) {
    if (!text || !search) {
        return false
    }
    return text.toLowerCase().indexOf(search.toLowerCase()) > -1
}

export function sortByDate(dateType, order) {
    return function (a, b) {
        const timeA = new Date(a[dateType]).getTime()
        const timeB = new Date(b[dateType]).getTime()
        if (order === 'asc') {
            return timeA - timeB
        }
        // default 'desc' descending order
        return timeB - timeA
    }
}

export function sortByName(key, order) {
    return function (a, b) {
        if (order === 'asc') {
            if (a[key] < b[key]) return -1
            if (a[key] > b[key]) return 1
        }
        if (a[key] > b[key]) return -1
        if (a[key] < b[key]) return 1
        return 0
    }
}

export function sortByPages(key, order) {
    return function (a, b) {
        const pagesA = JSON.parse(a[key]);
        const pagesB = JSON.parse(b[key]);
        if (order === 'desc') {
            if (pagesA.length < pagesB.length) return -1
            if (pagesA.length > pagesB.length) return 1
        }
        if (pagesA.length > pagesB.length) return -1
        if (pagesA.length < pagesB.length) return 1
        return 0
    }
}

export function sortBySize(order) {
    return function (a, b) {
        const sizeA = objSize(a);
        const sizeB = objSize(b);
        if (order === 'asc') {
            if (sizeA < sizeB) return -1
            if (sizeA > sizeB) return 1
        }
        if (sizeA > sizeB) return -1
        if (sizeA < sizeB) return 1
        return 0
    }
}