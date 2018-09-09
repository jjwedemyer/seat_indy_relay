require('dotenv').config();
const {send} = require('micro');
const request = require('request-promise');

const API = "https://seat.sotoc.space/api/v2/corporation/industry/";
const TOKEN = process.env.SEAT_TOKEN;
const CORP = process.env.CORP_ID;
const REQ_TOKEN = process.env.REQ_TOKEN;

const get_data = async (page) => {
  let res = {};
	const req = {
		method: 'GET',
		json: true,
		headers: {
      'accept': 'application/json',
      'X-Token': TOKEN
    },
    qs: {
      page: page
    },
    uri: `${API}${CORP}`
	};
  try {
    res = await request(req);
  } catch(e) {
    console.log(e);
  }
  return res.data;
};

const get_pages = async () => {
  const req = {
    method: 'GET',
    json: true,
    headers: {
      'accept': 'application/json',
      'X-Token': TOKEN
    },
    uri: `${API}${CORP}`
  };
  let data = await request(req);
  return data.meta.last_page;
};

const seat_data = async () => {
  let pages = await get_pages();
  let data = [],
  counts = {
    man: [],
    sci: [],
    reac: []
  };
  for(let i = pages-1; i <= pages; i++){
    data.push.apply(data, await get_data(i));
  }
  const filtered = data.filter(x => x.status !== 'delivered');
  const jobs = filtered.map(x =>{
    let activ = x.activity_id;
    let inst = x.installer_id;
    activ = (activ >1 && activ < 11 ? 2:(activ == 11? 3: activ));
    let ret = {
      ac: activ,
      installer: inst
    }; 
    return ret;
  });
  counts.man = filter_shizzle(jobs,1);
  counts.sci = filter_shizzle(jobs,2);
  counts.reac = filter_shizzle(jobs,3);
  return counts;
};

const filter_shizzle = (jobs,type) => {
  const filter_x = function(x){
    return x.ac == this.type && x.installer == this.inst;
  }
  let array = {};
  const installers = [...new Set(jobs.map(x => x.installer))];
  for(let inst of installers){
      let len = jobs.filter(filter_x,{type:type,inst:inst});
      array[inst] = len.length;
  }
  return array;
}

module.exports = async (req,res) => {
  if (req.headers.token != REQ_TOKEN){
    send(res,403,"Shitlord");
    return;
  }
  const data = await seat_data();
  console.log(data);
  send(res,200,data);
}