const axios = require('axios');
const querystring = require('querystring');

// Danh sách App IDs cho từng loại token
const APP_IDS = {
  EAAAAU: "350685531728",
  EAAD: "256002347743983", 
  EAAAAAY: "6628568379",
  EAADYP: "237759909591655",
  EAAD6V7: "275254692598279",
  EAAC2SPKT: "202805033077166",
  EAAGOfO: "200424423651082",
  EAAVB: "438142079694454",
  EAAC4: "1479723375646806",
  EAACW5F: "165907476854626",
  EAAB: "121876164619130",
  EAAQ: "1174099472704185",
  EAAGNO4: "436761779744620",
  EAAH: "522404077880990",
  EAAC: "184182168294603",
  EAAClA: "173847642670370",
  EAATK: "1348564698517390",
  EAAI7: "628551730674460"
};

class FB_TOKEN {
  constructor(cookie) {
    this.cookie = cookie;
    this.req = this._create_session();
  }
  
  _create_session() {
    const header = {
      'authority': 'www.facebook.com',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
      'cache-control': 'max-age=0',
      'dnt': '1',
      'dpr': '1.25',
      'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
      'sec-ch-ua-full-version-list': '"Chromium";v="117.0.5938.157", "Not;A=Brand";v="8.0.0.0"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-model': '""',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-platform-version': '"15.0.0"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'viewport-width': '1038',
    };
    const session = axios.create({
      headers: header,
      withCredentials: true
    });
    session.defaults.headers['Cookie'] = this.cookie;
    return session;
  }
  
  async mot(app_id) {
    const deadline = Date.now() + 60000;
    while (Date.now() <= deadline) {
      try {
        const res_data1 = (await this.req.get('https://www.facebook.com')).data;
        if (res_data1.includes('DTSGInitialData",[],{"token":"')) {
          const fb_dtsg = res_data1.split('DTSGInitialData",[],{"token":"')[1].split('"')[0];
          const data = {
            'fb_dtsg': fb_dtsg
          };
          const query = querystring.stringify(data);
          const res_data2 = (await this.req.post(`https://www.facebook.com/dialog/oauth/business/cancel/?app_id=${app_id}&version=v12.0&logger_id=&user_scopes[0]=user_birthday&user_scopes[1]=user_religion_politics&user_scopes[2]=user_relationships&user_scopes[3]=user_relationship_details&user_scopes[4]=user_hometown&user_scopes[5]=user_location&user_scopes[6]=user_likes&user_scopes[7]=user_education_history&user_scopes[8]=user_work_history&user_scopes[9]=user_website&user_scopes[10]=user_events&user_scopes[11]=user_photos&user_scopes[12]=user_videos&user_scopes[13]=user_friends&user_scopes[14]=user_about_me&user_scopes[15]=user_posts&user_scopes[16]=email&user_scopes[17]=manage_fundraisers&user_scopes[18]=read_custom_friendlists&user_scopes[19]=read_insights&user_scopes[20]=rsvp_event&user_scopes[21]=xmpp_login&user_scopes[22]=offline_access&user_scopes[23]=publish_video&user_scopes[24]=openid&user_scopes[25]=catalog_management&user_scopes[26]=user_messenger_contact&user_scopes[27]=gaming_user_locale&user_scopes[28]=private_computation_access&user_scopes[29]=instagram_business_basic&user_scopes[30]=user_managed_groups&user_scopes[31]=groups_show_list&user_scopes[32]=pages_manage_cta&user_scopes[33]=pages_manage_instant_articles&user_scopes[34]=pages_show_list&user_scopes[35]=pages_messaging&user_scopes[36]=pages_messaging_phone_number&user_scopes[37]=pages_messaging_subscriptions&user_scopes[38]=read_page_mailboxes&user_scopes[39]=ads_management&user_scopes[40]=ads_read&user_scopes[41]=business_management&user_scopes[42]=instagram_basic&user_scopes[43]=instagram_manage_comments&user_scopes[44]=instagram_manage_insights&user_scopes[45]=instagram_content_publish&user_scopes[46]=publish_to_groups&user_scopes[47]=groups_access_member_info&user_scopes[48]=leads_retrieval&user_scopes[49]=whatsapp_business_management&user_scopes[50]=instagram_manage_messages&user_scopes[51]=attribution_read&user_scopes[52]=page_events&user_scopes[53]=business_creative_transfer&user_scopes[54]=pages_read_engagement&user_scopes[55]=pages_manage_metadata&user_scopes[56]=pages_read_user_content&user_scopes[57]=pages_manage_ads&user_scopes[58]=pages_manage_posts&user_scopes[59]=pages_manage_engagement&user_scopes[60]=whatsapp_business_messaging&user_scopes[61]=instagram_shopping_tag_products&user_scopes[62]=read_audience_network_insights&user_scopes[63]=user_about_me&user_scopes[64]=user_actions.books&user_scopes[65]=user_actions.fitness&user_scopes[66]=user_actions.music&user_scopes[67]=user_actions.news&user_scopes[68]=user_actions.video&user_scopes[69]=user_activities&user_scopes[70]=user_education_history&user_scopes[71]=user_events&user_scopes[72]=user_friends&user_scopes[73]=user_games_activity&user_scopes[74]=user_groups&user_scopes[75]=user_hometown&user_scopes[76]=user_interests&user_scopes[77]=user_likes&user_scopes[78]=user_location&user_scopes[79]=user_managed_groups&user_scopes[80]=user_photos&user_scopes[81]=user_posts&user_scopes[82]=user_relationship_details&user_scopes[83]=user_relationships&user_scopes[84]=user_religion_politics&user_scopes[85]=user_status&user_scopes[86]=user_tagged_places&user_scopes[87]=user_videos&user_scopes[88]=user_website&user_scopes[89]=user_work_history&user_scopes[90]=email&user_scopes[91]=manage_notifications&user_scopes[92]=manage_pages&user_scopes[93]=publish_actions&user_scopes[94]=publish_pages&user_scopes[95]=read_friendlists&user_scopes[96]=read_insights&user_scopes[97]=read_page_mailboxes&user_scopes[98]=read_stream&user_scopes[99]=rsvp_event&user_scopes[100]=read_mailbox&user_scopes[101]=business_creative_management&user_scopes[102]=business_creative_insights&user_scopes[103]=business_creative_insights_share&user_scopes[104]=whitelisted_offline_access&redirect_uri=fbconnect%3A%2F%2Fsuccess&response_types[0]=token&response_types[1]=code&display=page&action=finish&return_scopes=false&return_format[0]=access_token&return_format[1]=code&tp=unspecified&sdk=&selected_business_id=&set_token_expires_in_60_days=false`, query)).data;
          const token = res_data2.split('access_token=')[1].split('&')[0];
          return {
            'message': 'Thành Công',
            'code': 200,
            'token': token
          };
        } else {
          return {
            'message': 'Cookie có vấn đề!',
            'code': 0,
            'token': null
          };
        }
      } catch (error) {
        if (error.code === 'ENOTFOUND') {
          console.log('No internet');
        } else {
          //console.error(error);
        }
      }
    }
    return {
      'message': 'Thành Công',
      'code': 0,
      'token': null
    };
  }
}

// Hàm lấy token theo loại
async function getTokenByType(tokenType, cookie) {
    if (!APP_IDS[tokenType]) {
        return {
            'message': `Loại token '${tokenType}' không tồn tại`,
            'code': 0,
            'token': null
        };
    }
    
    const fbToken = new FB_TOKEN(cookie);
    const result = await fbToken.mot(APP_IDS[tokenType]);
    return result;
}

// Hàm lấy tất cả các token
async function getAllTokens(cookie) {
    const tokens = {};
    const fbToken = new FB_TOKEN(cookie);
    
    for (const [tokenType, appId] of Object.entries(APP_IDS)) {
        try {
            const result = await fbToken.mot(appId);
            if (result.code === 200) {
                tokens[tokenType] = result.token;
            } else {
                tokens[tokenType] = null;
            }
        } catch (error) {
            tokens[tokenType] = null;
        }
    }
    
    return tokens;
}

// Hàm lấy danh sách loại token
function getTokenTypes() {
    return Object.keys(APP_IDS);
}

module.exports = {
    FB_TOKEN,
    APP_IDS,
    getTokenByType,
    getAllTokens,
    getTokenTypes
};
