const axios = require('axios');
const querystring = require('querystring');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { URLSearchParams } = require('url');

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

// User Agents đa dạng
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
];

class TurboFB_TOKEN {
  constructor(cookie) {
    this.cookie = cookie;
    this.sessionCache = new Map();
  }

  getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  async createTurboSession() {
    const session = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      withCredentials: true,
      headers: {
        'authority': 'www.facebook.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'upgrade-insecure-requests': '1',
        'user-agent': this.getRandomUserAgent(),
      }
    });

    // Interceptor để retry nhanh
    session.interceptors.response.use(null, async (error) => {
      if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        const config = error.config;
        if (!config.__retryCount) config.__retryCount = 0;
        if (config.__retryCount < 2) {
          config.__retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          return session(config);
        }
      }
      return Promise.reject(error);
    });

    session.defaults.headers['Cookie'] = this.cookie;
    return session;
  }

  async extractFB_DTSG(html) {
    const patterns = [
      /"token":"([^"]+)"/,
      /fb_dtsg["\s]*value=["']([^"']+)/,
      /DTSGInitialData[^}]+"token":"([^"]+)"/,
      /name="fb_dtsg" value="([^"]+)"/,
      /"fb_dtsg":"([^"]+)"/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async extractTokenFromResponse(html) {
    const tokenPatterns = [
      /access_token=([^&]+)/,
      /"access_token":"([^"]+)"/,
      /access_token["\s]*:["\s]*([^",\s]+)/,
      /EA[A-Za-z0-9+/]{150,}/,
      /access_token=([A-Za-z0-9+/]+)/
    ];

    for (const pattern of tokenPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  async getFB_DTSG(session) {
    try {
      const response = await session.get('https://www.facebook.com/', {
        timeout: 15000
      });
      
      const fb_dtsg = this.extractFB_DTSG(response.data);
      if (!fb_dtsg) {
        throw new Error('Không tìm thấy fb_dtsg');
      }
      return fb_dtsg;
    } catch (error) {
      // Thử URL backup
      try {
        const response = await session.get('https://mbasic.facebook.com/', {
          timeout: 15000
        });
        return this.extractFB_DTSG(response.data);
      } catch (backupError) {
        throw new Error('Không thể lấy fb_dtsg từ cả hai nguồn');
      }
    }
  }

  async turboGetToken(app_id) {
    const startTime = Date.now();
    
    try {
      const session = await this.createTurboSession();
      
      // Lấy fb_dtsg siêu tốc
      const fb_dtsg = await this.getFB_DTSG(session);
      if (!fb_dtsg) {
        return { success: false, error: 'Không lấy được fb_dtsg', time: Date.now() - startTime };
      }

      // Chuẩn bị payload tối ưu
      const params = new URLSearchParams();
      params.append('fb_dtsg', fb_dtsg);
      params.append('app_id', app_id);
      params.append('redirect_uri', 'fbconnect://success');
      params.append('scope', 'email,public_profile,user_friends');
      params.append('response_type', 'token');

      // Gửi request siêu tốc với timeout ngắn
      const tokenResponse = await session.post(
        `https://www.facebook.com/v12.0/dialog/oauth?app_id=${app_id}&redirect_uri=fbconnect%3A%2F%2Fsuccess&scope=email&response_type=token`,
        params.toString(),
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'origin': 'https://www.facebook.com',
            'referer': `https://www.facebook.com/v12.0/dialog/oauth?app_id=${app_id}`,
            'x-requested-with': 'XMLHttpRequest'
          },
          timeout: 20000,
          maxRedirects: 0,
          validateStatus: (status) => status < 400
        }
      );

      // Extract token từ response
      const token = this.extractTokenFromResponse(tokenResponse.data) || 
                   this.extractTokenFromResponse(tokenResponse.headers.location || '');

      if (token) {
        return {
          success: true,
          token: token,
          time: Date.now() - startTime
        };
      }

      // Fallback method - thử phương pháp khác
      return await this.fallbackMethod(session, app_id, fb_dtsg, startTime);

    } catch (error) {
      return {
        success: false,
        error: error.message,
        time: Date.now() - startTime
      };
    }
  }

  async fallbackMethod(session, app_id, fb_dtsg, startTime) {
    try {
      // Method 2: Sử dụng business/cancel endpoint
      const cancelUrl = `https://www.facebook.com/dialog/oauth/business/cancel/?app_id=${app_id}&redirect_uri=fbconnect%3A%2F%2Fsuccess&response_type=token`;
      
      const params = new URLSearchParams();
      params.append('fb_dtsg', fb_dtsg);

      const response = await session.post(cancelUrl, params.toString(), {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'origin': 'https://www.facebook.com',
          'referer': `https://www.facebook.com/dialog/oauth?app_id=${app_id}`
        },
        timeout: 15000
      });

      const token = this.extractTokenFromResponse(response.data);
      if (token) {
        return { success: true, token: token, time: Date.now() - startTime };
      }

      // Method 3: Sử dụng confirm endpoint
      const confirmUrl = `https://www.facebook.com/v12.0/dialog/oauth/confirm`;
      const confirmParams = new URLSearchParams();
      confirmParams.append('fb_dtsg', fb_dtsg);
      confirmParams.append('app_id', app_id);
      confirmParams.append('redirect_uri', 'fbconnect://success');
      confirmParams.append('display', 'page');
      confirmParams.append('response_type', 'token');

      const confirmResponse = await session.post(confirmUrl, confirmParams.toString(), {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'origin': 'https://www.facebook.com',
          'referer': `https://www.facebook.com/v12.0/dialog/oauth?app_id=${app_id}`
        },
        timeout: 15000
      });

      const confirmToken = this.extractTokenFromResponse(confirmResponse.data);
      if (confirmToken) {
        return { success: true, token: confirmToken, time: Date.now() - startTime };
      }

      return { success: false, error: 'Không thể extract token', time: Date.now() - startTime };

    } catch (error) {
      return { success: false, error: error.message, time: Date.now() - startTime };
    }
  }
}

// Worker function cho multi-threading
if (!isMainThread) {
  (async () => {
    const { cookie, appId, tokenType } = workerData;
    const fbToken = new TurboFB_TOKEN(cookie);
    
    try {
      const result = await fbToken.turboGetToken(appId);
      parentPort.postMessage({
        tokenType,
        success: result.success,
        token: result.token,
        error: result.error,
        time: result.time
      });
    } catch (error) {
      parentPort.postMessage({
        tokenType,
        success: false,
        token: null,
        error: error.message,
        time: 0
      });
    }
  })();
}

// Main functions
async function getTokenByType(tokenType, cookie) {
  if (!APP_IDS[tokenType]) {
    return {
      'message': `Loại token '${tokenType}' không tồn tại`,
      'code': 0,
      'token': null
    };
  }

  const fbToken = new TurboFB_TOKEN(cookie);
  const result = await fbToken.turboGetToken(APP_IDS[tokenType]);

  if (result.success) {
    return {
      'message': `Thành công - ${result.time}ms`,
      'code': 200,
      'token': result.token,
      'time': result.time
    };
  } else {
    return {
      'message': `Thất bại: ${result.error}`,
      'code': 0,
      'token': null,
      'time': result.time
    };
  }
}

async function getAllTokens(cookie) {
  const tokens = {};
  const errors = {};
  const times = {};
  
  const tokenTypes = Object.keys(APP_IDS);
  
  // Chia nhỏ thành các batch để chạy song song
  const batchSize = 3;
  const batches = [];
  
  for (let i = 0; i < tokenTypes.length; i += batchSize) {
    batches.push(tokenTypes.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const promises = batch.map(async (tokenType) => {
      const startTime = Date.now();
      try {
        const fbToken = new TurboFB_TOKEN(cookie);
        const result = await fbToken.turboGetToken(APP_IDS[tokenType]);
        times[tokenType] = Date.now() - startTime;
        
        if (result.success) {
          tokens[tokenType] = result.token;
        } else {
          tokens[tokenType] = null;
          errors[tokenType] = result.error;
        }
      } catch (error) {
        tokens[tokenType] = null;
        errors[tokenType] = error.message;
        times[tokenType] = Date.now() - startTime;
      }
    });

    // Chạy batch hiện tại song song
    await Promise.allSettled(promises);
  }

  return {
    tokens,
    errors,
    times,
    total: tokenTypes.length,
    successful: Object.values(tokens).filter(token => token !== null).length
  };
}

// Phiên bản multi-threading (siêu tốc)
async function getAllTokensTurbo(cookie) {
  return new Promise((resolve) => {
    const tokenTypes = Object.keys(APP_IDS);
    const workers = [];
    const results = {};
    let completed = 0;

    tokenTypes.forEach((tokenType) => {
      const worker = new Worker(__filename, {
        workerData: {
          cookie,
          appId: APP_IDS[tokenType],
          tokenType
        }
      });

      worker.on('message', (result) => {
        results[result.tokenType] = result.token;
        completed++;
        
        if (completed === tokenTypes.length) {
          resolve({
            tokens: results,
            total: tokenTypes.length,
            successful: Object.values(results).filter(token => token !== null).length
          });
        }
      });

      worker.on('error', (error) => {
        results[tokenType] = null;
        completed++;
        
        if (completed === tokenTypes.length) {
          resolve({
            tokens: results,
            total: tokenTypes.length,
            successful: Object.values(results).filter(token => token !== null).length
          });
        }
      });

      workers.push(worker);
    });
  });
}

// Hàm lấy danh sách loại token
function getTokenTypes() {
  return Object.keys(APP_IDS);
}

module.exports = {
  TurboFB_TOKEN,
  APP_IDS,
  getTokenByType,
  getAllTokens,
  getAllTokensTurbo,
  getTokenTypes
};
