import { readFileSync, writeFileSync } from 'node:fs'
import { EOL } from 'node:os'
import { resolve } from 'node:path'
import semver from 'semver'

const GITHUB_REF = process.env['GITHUB_REF']
const PKG_LOCATION = resolve(__dirname, '../..', 'package.json')

const setVersion = (version: string) => {
    console.log(`Writing version to package.json: '${version}'...`)

    const pkg = JSON.parse(readFileSync(PKG_LOCATION).toString())
    pkg.version = version
    const newPkg = `${JSON.stringify(pkg, null, 2)}${EOL}`

    writeFileSync(PKG_LOCATION, newPkg)
}

const main = () => {
    const tagName = GITHUB_REF?.replace('refs/tags/', '')
    if (!tagName) {
        console.error('GITHUB_REF is not set')
        process.exit(1)
    }

    const version = semver.clean(tagName)

    if (!version) {
        console.error(`'${tagName}' is not a valid semver version`)
        process.exit(1)
    }

    setVersion(version)
}

main()
