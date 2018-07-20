const path = require('path')

const Types = {
    Library: 'Library',
    ForgeHosted: 'ForgeHosted',
    LiteLoader: 'LiteLoader',
    ForgeMod: 'ForgeMod',
    LiteMod: 'LiteMod',
    File: 'File'
}

class Artifact {
    
    static fromJSON(json){
        return Object.assign(new Artifact(), json)
    }

    getHash(){
        return this.MD5
    }

    getSize(){
        return this.size
    }

    getURL(){
        return this.url
    }

}

class Required {
    
    static fromJSON(json){
        if(json == null){
            return new Required(true, true)
        } else {
            return new Required(json.value == null ? true : json.value, json.def == null ? true : json.def)
        }
    }

    constructor(value, def){
        this.value = value
        this.default = def
    }

    isDefault(){
        return this.default
    }

    isRequired(){
        return this.value
    }

}

class Module {

    static fromJSON(json){
        let moduleType = Types[json.type] || Module
        return new Module(json.id, json.name, json.type, json.required, json.artifact, json.subModules)
    }

    static _resolveDefaultExtension(type){
        switch (type) {
            case Types.Library:
            case Types.ForgeHosted:
            case Types.LiteLoader:
            case Types.ForgeMod:
                return 'jar'
            case Types.LiteMod:
                return 'litemod'
            case Types.File:
            default:
                return 'jar' // There is no default extension really.
        }
    }

    constructor(id, name, type, required, artifact, subModules) {
        this.identifier = id
        this.type = type
        this._resolveMetaData()
        this.name = name
        this.required = Required.fromJSON(required)
        this.artifact = Artifact.fromJSON(artifact)
        this._resolveArtifactPath(artifact.path)
        this._resolveSubModules(subModules)
        console.log(this.type)
    }

    _resolveMetaData(){
        try {

            const m0 = this.identifier.split('@')

            this.artifactExt = '.' + (m0[1] || Module._resolveDefaultExtension(this.type))

            const m1 = m0[0].split(':')

            this.artifactVersion = m1[2] || '???'
            this.artifactID = m1[1] || '???'
            this.artifactGroup = m1[0] || '???'

        } catch (err) {
            // Improper identifier
            console.error('Improper ID for module', this.identifier, err)
        }
    }

    _resolveArtifactPath(artifactPath){
        if(artifactPath == null){
            this.artifactPath = path.join(...this.getGroup().split('.'), this.getID(), this.getVersion(), `${this.getID()}-${this.getVersion()}.${this.getExtension()}`)
        } else {
            this.artifactPath = artifactPath
        }
    }

    _resolveSubModules(json){
        const arr = []
        if(json != null){
            for(let sm of json){
                arr.push(Module.fromJSON(sm))
            }
        }
        this.subModules = arr
    }

    getIdentifier(){
        return this.identifier
    }

    getName(){
        return this.name
    }

    getRequired(){
        return this.required
    }

    getArtifact(){
        return this.artifact
    }

    getID(){
        return this.artifactID
    }

    getGroup(){
        return this.artifactGroup
    }

    getVersion(){
        return this.artifactVersion
    }

    getExtension(){
        return this.artifactExt
    }

    getSubModules(){
        return this.subModules
    }

    getType(){
        return this.type
    }

}

class Server {

    static fromJSON(json){

        const mdls = json.modules
        json.modules = []

        const serv = Object.assign(new Server(), json)
        serv._resolveModules(mdls)

        //const serv = Object.assign(new Server(), JSON.parse(json))
        //serv._resolveModules(json.modules)
        return serv
    }

    _resolveModules(json){
        const arr = []
        for(let m of json){
            arr.push(Module.fromJSON(m))
        }
        this.modules = arr
    }

    getID(){
        return this.id
    }

    getName(){
        return this.name
    }

    getDescription(){
        return this.description
    }

    getIcon(){
        return this.icon
    }

    getVersion(){
        return this.version
    }

    getAddress(){
        return this.address
    }

    getMinecraftVersion(){
        return this.minecraftVersion
    }

    isMainServer(){
        return this.mainServer
    }

    isAutoConnect(){
        return this.autoconnect
    }

    getModules(){
        return this.modules
    }

}

class DistroIndex {

    static fromJSON(json){

        const servers = json.servers
        json.servers = []

        const distro = Object.assign(new DistroIndex(), json)
        distro._resolveServers(servers)

        return distro

    }

    _resolveServers(json){
        const arr = []
        for(let s of json){
            arr.push(Server.fromJSON(s))
        }
        this.servers = arr
    }

}

class DistroManager {
    
}

console.log(DistroIndex.fromJSON(JSON.parse(require('fs').readFileSync('../westeroscraftNew.json', 'utf-8'))))

module.exports = {
    DistroManager,
    Types
}