import config from './config.js';
import fetch from 'node-fetch';
let globToken = '';
let globalCIs = [];

function getBMCToken() {

    const params = new URLSearchParams();

    params.append('username', config.remedy.user_name);
    params.append('password', config.remedy.password);

    return fetch(config.bmc.protocol + '://' + config.bmc.host + '/api/jwt/login', {
        method: 'post',
        headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params
    });
}

function createAsmVertex(instance) {
    console.log("Creating ASM Vertex")
    let asmObject = {}
    asmObject["uniqueId"] = instance["instance_id"]
    asmObject["sys_class_name"] = instance["class_name_key"]["name"]
    for (var prop in instance["attributes"]) {
        if (Object.prototype.hasOwnProperty.call(obj, instance["attributes"])) {
            asmObject[prop] = instance["attributes"][prop]
        }
    }          
 
    // Determine ASM naming
 
    if (asmObject.hasOwnProperty("HostName")) {
        asmObject["name"] = asmObject["HostName"];
        const re = /(.*)\.videotron\.com/g
        const ar_re = arr = rx.exec(asmObject["name"]); 
        if (ar_re.length) {
            if (ar_re[1]) {
                asmObject["shortname"] = ar_re[1];
                asmObject["longname"] = asmObject["name"]
                asmObject["name"] = asmObject["shortname"]
            }
        }
    } else if (asmObject.hasOwnProperty("Name")) {
        asmObject["name"] = asmObject["HostName"];
        const re = /(.*)\.videotron\.com/g
        const ar_re = arr = rx.exec(asmObject["name"]); 
        if (ar_re.length) {
            if (ar_re[1]) {
                asmObject["shortname"] = ar_re[1];
                asmObject["longname"] = asmObject["name"];
                asmObject["name"] = asmObject["shortname"];
            }
        }
    } else {
        asmObject["name"] = asmObject["uniqueId"];
    }
       
    asmObject["_operation"] = "InsertReplace"
    asmObject["uniqueId"] = asmObject["uniqueId"]
 
    // Determine ASM entityType
 
    console.log("Determining PrimaryCapability");
 
    if (asmObject.hasOwnProperty("PrimaryCapability")) {
        console.log("PRIMARYCAPABILITY: this object has a PrimaryCapability field, and it is: " + asmObject["PrimaryCapability"])
    }

    //    if( asmObject["PrimaryCapability"] in primaryCapabilityMappingDict):
    //       print("PRIMARYCAPABILITY: this object is in our Mapping Dict")
    //       asmObject["entityTypes"] = [  primaryCapabilityMappingDict[asmObject["PrimaryCapability"]] ]
    //    elif( asmObject["sys_class_name"] in entityTypeMappingDict):
    //       print("PRIMARYCAPABILITY: No mapping for PrimaryCapabilty " + asmObject["PrimaryCapability"])
    //       asmObject["entityTypes"] = [ entityTypeMappingDict[asmObject["sys_class_name"]] ]
    //    else:
    //       print("PrimaryCapability exists, but no mapping exists for PrimaryCapability \"" + asmObject["PrimaryCapability"] + "\", nor does a mapping exist for object class \"" + asmObject["sys_class_name"] + "\"")
    // elif( asmObject["sys_class_name"] in entityTypeMappingDict):
    //    print("No PrimaryCapability field in record, but we do have a class mapping")
    //    asmObject["entityTypes"] = [ entityTypeMappingDict[asmObject["sys_class_name"]] ]
    // else:
    //    print("No PrimaryCapability field in record, and no entityTypeMapping for class " + asmObject["sys_class_name"] + ". defaulting to server")
    //    asmObject["entityTypes"] = "server"
 
    // # Identify any fields that would be useful to use as matchTokens...
 
    // asmObject["matchTokens"] = [ asmObject["name"] + ":" + asmObject["uniqueId"] ]
    // asmObject["matchTokens"].append( asmObject["uniqueId"] )
    // asmObject["matchTokens"].append( asmObject["name"] )
    // if asmObject.__contains__("HostName"):
    //    if( asmObject["HostName"] ):
    //       asmObject["matchTokens"].append(asmObject["HostName"])
       
 
    // if (asmObject.__contains__("AssetLifecycleStatus") and len(assetLifecycleStatusFilterArray) > 0):
    //    if(asmObject["AssetLifecycleStatus"] in assetLifecycleStatusFilterArray):
    //       ciSysIdList.append(asmObject["uniqueId"])
    //       return(asmObject)
    //    else:
    //       print("This object AssetLifecycleStatus not in configuration: " + asmObject["AssetLifecycleStatus"].encode('utf-8') + ". Dropping object " + asmObject["name"].encode('utf-8'))
    //       return(0)
    // else:
    //    ciSysIdList.append(asmObject["uniqueId"])
    //    return(asmObject)
    //  return instance;
}

function getCIs(progress, url = 'https://bmc', planets = [], offset, limit) {
  url = url + '?offset=' + offset + '&limit=' + limit;
  return new Promise((resolve, reject) => fetch(url,{
    method: "GET",
    headers: {Authorization: `AR-JWT ${globToken}`}lstat
  })
    .then(response => {
        if (response.status !== 200)  {
          throw `${response.status}: ${response.statusText}`;
        }
        response.json().then(data => { 
          const localCIs = data.instances.map(i => {
             return createAsmVertex(i);
          });
          globalCIs = globalCIs.concat(localCIs);

          if(localCIs.length >= limit) {
            progress && progress(globalCIs);
            getCIs(progress, url, [], offset + limit, limit).then(resolve).catch(reject)
          } else {
            resolve(globalCIs);
          }
        }).catch(reject);
    }).catch(reject));
}

function progressCallback(CIs) {
  // render progress
  console.log(`${CIs.length} loaded`);
}

function getCIData(classCMDB) {
    const urlCI = config.bmc.protocol + '://' + config.bmc.host + '/api/cmdb/v1.0/instances/BMC.ASSET/BMC.CORE/'+ classCMDB; 
    console.log('Read loop for class:', classCMDB);
    getCIs(progressCallback, urlCI, [], 0, 500)
    .then(CIs => {
      // all planets have been loaded
      console.log(CIs.map(i => i.name))
    })
    .catch(console.error);  
}

  
const gotTokenPromise = getBMCToken();
gotTokenPromise.then(r => {
    if (r.status !== 200) {
        console.log('There was a problem on the login', r.status);
        throw `${r.status}: ${r.statusText}`;
    }
    r.text().then(function(data) {
        globToken = data;
        getCIData('BMC_ComputerSystem');
    });
});
