const path = require('path')

const Types = {
    Library: 'Library',
    ForgeHosted: 'ForgeHosted',
    LiteLoader: 'LiteLoader',
    ForgeMod: 'ForgeMod',
    LiteMod: 'LiteMod',
    File: 'File'
}

/**
 * Represents the download information
 * for a specific module.
 */
class Artifact {
    
    /**
     * Parse a JSON object into an Artifact.
     * 
     * @param {Object} json A JSON object representing an Artifact.
     * 
     * @returns {Artifact} The parsed Artifact.
     */
    static fromJSON(json){
        return Object.assign(new Artifact(), json)
    }

    /**
     * Get the MD5 hash of the artifact. This value may
     * be undefined for artifacts which are not to be
     * validated and updated.
     * 
     * @returns {string} The MD5 hash of the Artifact or undefined.
     */
    getHash(){
        return this.MD5
    }

    /**
     * @returns {number} The download size of the artifact.
     */
    getSize(){
        return this.size
    }

    /**
     * @returns {string} The download url of the artifact.
     */
    getURL(){
        return this.url
    }

    /**
     * @returns {string} The artifact's destination path.
     */
    getPath(){
        return this.path
    }

}

/**
 * Represents a the requirement status
 * of a module.
 */
class Required {
    
    /**
     * Parse a JSON object into a Required object.
     * 
     * @param {Object} json A JSON object representing a Required object.
     * 
     * @returns {Required} The parsed Required object.
     */
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

    /**
     * Get the default value for a required object. If a module
     * is not required, this value determines whether or not
     * it is enabled by default.
     * 
     * @returns {boolean} The default enabled value.
     */
    isDefault(){
        return this.default
    }

    /**
     * @returns {boolean} Whether or not the module is required.
     */
    isRequired(){
        return this.value
    }

}

/**
 * Represents a module.
 */
class Module {

    /**
     * Parse a JSON object into a Module.
     * 
     * @param {Object} json A JSON object representing a Module.
     * 
     * @returns {Module} The parsed Module.
     */
    static fromJSON(json){
        return new Module(json.id, json.name, json.type, json.required, json.artifact, json.subModules)
    }

    /**
     * Resolve the default extension for a specific module type.
     * 
     * @param {string} type The type of the module.
     * 
     * @return {string} The default extension for the given type.
     */
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
            const pth = path.join(...this.getGroup().split('.'), this.getID(), this.getVersion(), `${this.getID()}-${this.getVersion()}.${this.getExtension()}`)
            
            switch (this.type){
                case Types.Library:
                case Types.ForgeHosted:
                case Types.LiteLoader:
                    this.artifact.path = path.join('libraries', pth)
                    break
                case Types.ForgeMod:
                case Types.LiteMod:
                    this.artifact.path = path.join('modstore', pth)
                    break
                case Types.File:
                default:
                    this.artifact.path = pth
                    break
            }

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

    /**
     * @returns {string} The full, unparsed module identifier.
     */
    getIdentifier(){
        return this.identifier
    }

    /**
     * @returns {string} The name of the module.
     */
    getName(){
        return this.name
    }

    /**
     * @returns {Required} The required object declared by this module.
     */
    getRequired(){
        return this.required
    }

    /**
     * @returns {Artifact} The artifact declared by this module.
     */
    getArtifact(){
        return this.artifact
    }

    /**
     * @returns {string} The maven identifier of this module's artifact.
     */
    getID(){
        return this.artifactID
    }

    /**
     * @returns {string} The maven group of this module's artifact.
     */
    getGroup(){
        return this.artifactGroup
    }

    /**
     * @returns {string} The version of this module's artifact.
     */
    getVersion(){
        return this.artifactVersion
    }

    /**
     * @returns {string} The extension of this module's artifact.
     */
    getExtension(){
        return this.artifactExt
    }

    /**
     * @returns {boolean} Whether or not this module has sub modules.
     */
    hasSubModules(){
        return this.subModules.length > 0
    }

    /**
     * @returns {Array.<Module>} An array of sub modules.
     */
    getSubModules(){
        return this.subModules
    }

    /**
     * @returns {string} The type of the module.
     */
    getType(){
        return this.type
    }

}

/**
 * Represents a server configuration.
 */
class Server {

    /**
     * Parse a JSON object into a Server.
     * 
     * @param {Object} json A JSON object representing a Server.
     * 
     * @returns {Server} The parsed Server object.
     */
    static fromJSON(json){

        const mdls = json.modules
        json.modules = []

        const serv = Object.assign(new Server(), json)
        serv._resolveModules(mdls)

        return serv
    }

    _resolveModules(json){
        const arr = []
        for(let m of json){
            arr.push(Module.fromJSON(m))
        }
        this.modules = arr
    }

    /**
     * @returns {string} The ID of the server.
     */
    getID(){
        return this.id
    }

    /**
     * @returns {string} The name of the server.
     */
    getName(){
        return this.name
    }

    /**
     * @returns {string} The description of the server.
     */
    getDescription(){
        return this.description
    }

    /**
     * @returns {string} The URL of the server's icon.
     */
    getIcon(){
        return this.icon
    }

    /**
     * @returns {string} The version of the server configuration.
     */
    getVersion(){
        return this.version
    }

    /**
     * @returns {string} The IP address of the server.
     */
    getAddress(){
        return this.address
    }

    /**
     * @returns {string} The minecraft version of the server.
     */
    getMinecraftVersion(){
        return this.minecraftVersion
    }

    /**
     * @returns {boolean} Whether or not this server is the main
     * server. The main server is selected by the launcher when
     * no valid server is selected.
     */
    isMainServer(){
        return this.mainServer
    }

    /**
     * @returns {boolean} Whether or not the server is autoconnect.
     * by default.
     */
    isAutoConnect(){
        return this.autoconnect
    }

    /**
     * @returns {Array.<Module>} An array of modules for this server.
     */
    getModules(){
        return this.modules
    }

}

/**
 * Represents the Distribution Index.
 */
class DistroIndex {

    /**
     * Parse a JSON object into a DistroIndex.
     * 
     * @param {Object} json A JSON object representing a DistroIndex.
     * 
     * @returns {DistroIndex} The parsed Server object.
     */
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

    /**
     * @returns {string} The version of the distribution index.
     */
    getVersion(){
        return this.version
    }

    /**
     * @returns {string} The URL to the news RSS feed.
     */
    getRSS(){
        return this.rss
    }

    /**
     * @returns {Array.<Server>} An array of declared server configurations.
     */
    getServers(){
        return this.servers
    }

}

class DistroManager {
    
}

console.log(DistroIndex.fromJSON(JSON.parse(require('fs').readFileSync('../distribution.json', 'utf-8'))))

module.exports = {
    DistroManager,
    Types
}