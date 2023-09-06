import { sep } from 'node:path';
import { FilePath, Path } from "./types";

const convertToSitemapPath = ({ base, dist, publicPath }: { base: string, dist: string, publicPath: string }) => ({name, path}:FilePath):Path => {

    const basePriority = 10

    const parts = path.split(dist).join('').split(sep)

    const depth = parts.length


    const isIndex =  name === 'index.html';

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

    const priority = +((basePriority/(depth) - (isIndex ? 0 : 1))/10).toPrecision(2)

    return { path: line, priority }
}

export { convertToSitemapPath }