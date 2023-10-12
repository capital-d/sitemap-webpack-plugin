import { sep } from 'node:path';
import { FilePath, Path } from "./types";

const calculatePriority = ({isIndex, depth}:{isIndex:boolean, depth: number}) => {
    const basePriority = 10
    return +((basePriority/(depth) - (isIndex ? 0 : 1))/10).toPrecision(2)
}

const convertAssetToSitemapPath = ({ base, publicPath }: { base: string, publicPath: string }) => (input:string):Path => {

    const itputArray = input.replace(/^\.\//, '').split('/')

    const name = itputArray.slice(-1)[0]

    const parts = itputArray.slice(0,-1)

    const depth = parts.length + 1

    const isIndex = name === 'index.html';

    const htmlName = isIndex ? '' : `${name}`;

    const pathArray = [base]
    const innerPath = parts.join('/').replace(/^\//, '')

    if (publicPath.replace(/\/$/, '') !== '') {
        pathArray.push(publicPath.replace(/\/$/, ''))
    }
    if (innerPath.replace(/\/$/, '') !== '') {
        pathArray.push(innerPath.replace(/\/$/, ''))
    }

    pathArray.push(htmlName)

    const line = pathArray.join('/')

    const priority = calculatePriority({isIndex, depth})


    return { path: line, priority }
}

export { convertAssetToSitemapPath }