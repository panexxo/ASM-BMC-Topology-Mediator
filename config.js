var config = {};

config.remedy = {};
config.bmc = {};
config.web = {};

// username,password acces BMC API
config.remedy.user_name = process.env.BMC_USER || 'JP';
config.remedy.password=  process.env.BMC_PASSWORD || '123';

//config.bmc.uri = "itsmacc.int.videotron.com";
config.bmc.host = "localhost:3000";
config.bmc.protocol = "http";
//config.bmc.protocol = "https";


export default config;

