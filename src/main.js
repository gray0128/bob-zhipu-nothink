/**
 * GLM 4.5 翻译 (关闭思考) Bob 插件
 * 基于智谱 GLM-4.5-Flash 的快速翻译插件，避免触发思考功能以提升翻译速度
 * 
 * @author 波菠菜
 * @version 1.0.0
 */

var lang = require('./lang.js');

/**
 * 支持的语言映射
 */
const SUPPORTED_LANGUAGES = {
    'auto': 'auto',
    'zh-Hans': 'zh',
    'zh-Hant': 'zh-tw',
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko',
    'fr': 'fr',
    'de': 'de',
    'es': 'es',
    'it': 'it',
    'ru': 'ru',
    'pt': 'pt',
    'ar': 'ar',
    'hi': 'hi',
    'th': 'th',
    'vi': 'vi',
    'id': 'id',
    'ms': 'ms',
    'tr': 'tr',
    'nl': 'nl',
    'pl': 'pl',
    'cs': 'cs',
    'sk': 'sk',
    'hu': 'hu',
    'ro': 'ro',
    'bg': 'bg',
    'hr': 'hr',
    'sl': 'sl',
    'et': 'et',
    'lv': 'lv',
    'lt': 'lt',
    'fi': 'fi',
    'sv': 'sv',
    'da': 'da',
    'no': 'no',
    'is': 'is',
    'el': 'el',
    'he': 'he',
    'fa': 'fa',
    'ur': 'ur',
    'bn': 'bn',
    'ta': 'ta',
    'te': 'te',
    'ml': 'ml',
    'kn': 'kn',
    'gu': 'gu',
    'pa': 'pa',
    'ne': 'ne',
    'si': 'si',
    'my': 'my',
    'km': 'km',
    'lo': 'lo',
    'ka': 'ka',
    'am': 'am',
    'sw': 'sw',
    'zu': 'zu',
    'af': 'af',
    'sq': 'sq',
    'az': 'az',
    'be': 'be',
    'bs': 'bs',
    'eu': 'eu',
    'gl': 'gl',
    'is': 'is',
    'ga': 'ga',
    'mk': 'mk',
    'mt': 'mt',
    'mn': 'mn',
    'sr': 'sr',
    'uk': 'uk',
    'cy': 'cy',
    'yi': 'yi'
};

/**
 * 智谱 API 基础 URL
 */
const API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

/**
 * 获取语言的显示名称
 */
function getLanguageName(langCode) {
    return lang.langMap.get(langCode) || langCode;
}

/**
 * 构建翻译提示词
 */
function buildTranslatePrompt(text, fromLang, toLang, customPrompt) {
    const fromLangName = getLanguageName(fromLang);
    const toLangName = getLanguageName(toLang);
    
    if (customPrompt && customPrompt.trim()) {
        return customPrompt
            .replace(/\{text\}/g, text)
            .replace(/\{from\}/g, fromLangName)
            .replace(/\{to\}/g, toLangName);
    }
    
    // 默认提示词，专门设计来避免触发思考
    if (fromLang === 'auto') {
        return `请将以下文本翻译成${toLangName}，直接输出翻译结果，不要解释：\n\n${text}`;
    } else {
        return `请将以下${fromLangName}文本翻译成${toLangName}，直接输出翻译结果，不要解释：\n\n${text}`;
    }
}

/**
 * 调用智谱 API
 */
function callZhipuAPI(apiKey, model, messages, temperature, timeout) {
    return new Promise((resolve, reject) => {
        const requestBody = {
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: 1024, // 和 Bob 默认的最大长度保持一致
            stream: false,
            // 关键参数：避免触发思考
            thinking: {"type": "disabled"},
            top_p: 0.1
        };
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Bob/1.0.0 (ZhipuTranslator/1.0.0)'
        };
        
        $http.request({
            method: 'POST',
            url: `${API_BASE_URL}/chat/completions`,
            header: headers,
            body: requestBody,
            timeout: timeout * 1000
        }).then(response => {
            if (response.response && response.response.statusCode === 200) {
                try {
                    const data = response.data;
                    if (data.choices && data.choices.length > 0) {
                        const translatedText = data.choices[0].message.content.trim();
                        resolve(translatedText);
                    } else {
                        reject(new Error('API 返回数据格式错误'));
                    }
                } catch (error) {
                    reject(new Error(`解析响应失败: ${error.message}`));
                }
            } else {
                const statusCode = response.response ? response.response.statusCode : 'unknown';
                const errorMsg = response.data ? response.data.error?.message || response.data.message : '未知错误';
                reject(new Error(`API 请求失败 (${statusCode}): ${errorMsg}`));
            }
        }).catch(error => {
            reject(new Error(`网络请求失败: ${error.message || error}`));
        });
    });
}

/**
 * 检测文本语言
 */
function detectLanguage(text) {
    // 简单的语言检测逻辑
    const chineseRegex = /[\u4e00-\u9fff]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanRegex = /[\uac00-\ud7af]/;
    const arabicRegex = /[\u0600-\u06ff]/;
    const thaiRegex = /[\u0e00-\u0e7f]/;
    const russianRegex = /[\u0400-\u04ff]/;
    
    if (chineseRegex.test(text)) {
        return 'zh-Hans';
    } else if (japaneseRegex.test(text)) {
        return 'ja';
    } else if (koreanRegex.test(text)) {
        return 'ko';
    } else if (arabicRegex.test(text)) {
        return 'ar';
    } else if (thaiRegex.test(text)) {
        return 'th';
    } else if (russianRegex.test(text)) {
        return 'ru';
    } else {
        return 'en';
    }
}

/**
 * 主翻译函数
 */
function translate(query, completion) {
    const { text, detectFrom, detectTo } = query;
    
    // 获取配置
    const apiKey = $option.apiKey;
    const model = $option.model || 'glm-4-flash';
    const customPrompt = $option.customPrompt || '';
    const temperature = parseFloat($option.temperature) || 0.1;
    const timeout = parseInt($option.timeout) || 10;
    
    // 验证 API Key
    if (!apiKey || apiKey.trim() === '') {
        completion({
            error: {
                type: 'param',
                message: '请在插件配置中设置智谱 AI 的 API Key',
                addition: '请前往 https://open.bigmodel.cn/ 获取 API Key'
            }
        });
        return;
    }
    
    // 处理语言代码
    let fromLang = detectFrom;
    let toLang = detectTo;
    
    // 如果是自动检测，进行语言检测
    if (fromLang === 'auto') {
        fromLang = detectLanguage(text);
    }
    
    // 检查是否支持的语言
    if (!SUPPORTED_LANGUAGES[fromLang] || !SUPPORTED_LANGUAGES[toLang]) {
        completion({
            error: {
                type: 'unsupportLanguage',
                message: `不支持的语言对: ${fromLang} -> ${toLang}`,
                addition: '请检查源语言和目标语言设置'
            }
        });
        return;
    }
    
    // 如果源语言和目标语言相同，直接返回原文
    if (fromLang === toLang) {
        completion({
            result: {
                from: fromLang,
                to: toLang,
                toParagraphs: [text]
            }
        });
        return;
    }
    
    // 构建消息
    const prompt = buildTranslatePrompt(text, fromLang, toLang, customPrompt);
    const messages = [
        {
            role: 'user',
            content: prompt
        }
    ];
    
    // 调用 API
    callZhipuAPI(apiKey, model, messages, temperature, timeout)
        .then(translatedText => {
            completion({
                result: {
                    from: fromLang,
                    to: toLang,
                    toParagraphs: [translatedText]
                }
            });
        })
        .catch(error => {
            $log.error('智谱翻译错误:', error.message);
            completion({
                error: {
                    type: 'api',
                    message: error.message,
                    addition: '请检查网络连接和 API Key 设置'
                }
            });
        });
}

/**
 * 支持的语言列表
 */
function supportLanguages() {
    return Object.keys(SUPPORTED_LANGUAGES);
}

// 导出函数
exports.translate = translate;
exports.supportLanguages = supportLanguages;