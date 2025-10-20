const log = require('electron-log');
const axios = require('axios');
const { getDecryptedApiKeys } = require('./apiHandlers');


async function handleExaWebTask(payload) {
    const { task, query, advancedOptions } = payload;
    
    try {
        const apiKeys = await getDecryptedApiKeys();
        const exaApiKey = apiKeys.exaApiKey;

        if (!exaApiKey) {
            throw new Error("Exa.ai API Key is not configured in Account Settings.");
        }

        const headers = { 
            'Authorization': `Bearer ${exaApiKey}`, 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        };
        const searchUrl = 'https://api.exa.ai/search';
        const findSimilarUrl = 'https://api.exa.ai/findSimilar';
        const contentsUrl = 'https://api.exa.ai/contents';
        const answerUrl = 'https://api.exa.ai/answer';
        const researchUrl = 'https://api.exa.ai/research/v1';
        
        let requestBody = {
            query: query,
            numResults: advancedOptions?.numResults || 5, 
            includeDomains: (advancedOptions?.domainIncludes || []).map(d => d.trim()).filter(d => d.length > 0),
            excludeDomains: (advancedOptions?.domainExcludes || []).map(d => d.trim()).filter(d => d.length > 0),
            startPublishedDate: advancedOptions?.startDate || null, 
            endPublishedDate: advancedOptions?.endDate || null, 
            text: true,
            highlights: true,
        };


        if (task === 'search') {
            log.info(`Exa.ai: Running standard search for: ${query.substring(0, 50)}`);
            const response = await axios.post(searchUrl, requestBody, { headers });
            return { success: true, results: response.data.results || [] };
        } 
        else if (task === 'research') {
            const selectedModel = advancedOptions?.model || "exa-research";
            
            if (selectedModel === 'exa') {
                log.info(`Exa.ai: Running research using Exa.ai's answer API for: ${query.substring(0, 50)}`);
                
                const answerRequestBody = {
                    query: query,
                    numResults: advancedOptions?.numResults || 5,
                    includeDomains: (advancedOptions?.domainIncludes || []).map(d => d.trim()).filter(d => d.length > 0),
                    excludeDomains: (advancedOptions?.domainExcludes || []).map(d => d.trim()).filter(d => d.length > 0),
                    startPublishedDate: advancedOptions?.startDate || null,
                    endPublishedDate: advancedOptions?.endDate || null,
                    text: true,
                    highlights: true,
                    model: "exa",
                    type: "auto"
                };
                
                const response = await axios.post(answerUrl, answerRequestBody, { headers });
                
                if (response.data && response.data.answer) {
                    const sources = response.data.sources || [];
                    const sourceUrls = sources.map(s => s.url).filter(url => url);
                    
                    return { 
                        success: true, 
                        answer: response.data.answer,
                        sourceUrls: sourceUrls
                    };
                } else {
                    return { success: true, answer: "Exa.ai could not generate a research answer for this query." };
                }
            } else {
                log.info(`Exa.ai: Running research using Exa.ai's research API for: ${query.substring(0, 50)}`);
                
                const researchRequestBody = {
                    instructions: query,
                    model: selectedModel
                };
                
                log.info(`Exa.ai: Research request body: ${JSON.stringify(researchRequestBody)}`);
                
                const createResponse = await axios.post(researchUrl, researchRequestBody, { headers });
                log.info(`Exa.ai: Research create response: ${JSON.stringify(createResponse.data)}`);
                const researchId = createResponse.data.researchId || createResponse.data.id;
                
                if (!researchId) {
                    throw new Error("Failed to start research task - no researchId returned");
                }
                
                log.info(`Exa.ai: Research task started with ID: ${researchId}`);
                
                const maxPolls = 300;
                let pollCount = 0;
                let consecutiveErrors = 0;
                const maxConsecutiveErrors = 3;
                
                while (pollCount < maxPolls) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 5000)); 
                        const pollResponse = await axios.get(`${researchUrl}/${researchId}`, { headers });
                        consecutiveErrors = 0; 
                        log.info(`Exa.ai: Poll response: ${JSON.stringify(pollResponse.data)}`);
                        const status = pollResponse.data.status;
                        
                        log.info(`Exa.ai: Research task ${researchId} status: ${status}`);
                        
                        if (status === 'completed') {
                            const result = pollResponse.data;
                            
                            const content = result.output?.content || result.answer || result.response || result.result || "Research completed but no content provided";
                            
                            return {
                                success: true,
                                answer: content,
                                sourceUrls: [] 
                         };
                        } else if (status === 'failed' || status === 'error') {
                            throw new Error(`Research task failed: ${pollResponse.data.error || pollResponse.data.message || 'Unknown error'}`);
                        }
                        
                        pollCount++;
                    } catch (pollError) {
                        consecutiveErrors++;
                        log.warn(`Exa.ai: Poll attempt ${pollCount + 1} failed (${consecutiveErrors}/${maxConsecutiveErrors}): ${pollError.message}`);
                        
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            throw new Error(`Research polling failed after ${maxConsecutiveErrors} consecutive errors. Last error: ${pollError.message}`);
                        }
                        
                        pollCount++;
                    }
                }
                
                throw new Error("Research task timed out after 25 minutes");
            }
        }
        else if (task === 'crawl') {
            log.info(`Exa.ai: Running crawl (raw content) task on URL: ${query.substring(0, 50)}`);

            const crawlRequestBody = { urls: [query] };
            
            if (payload.livecrawl && payload.livecrawl !== 'never') {
                crawlRequestBody.livecrawl = payload.livecrawl;
                log.info(`Exa.ai: Using livecrawl mode: ${payload.livecrawl}`);
            }

            const contentResponse = await axios.post(contentsUrl, crawlRequestBody, { headers });
            const resultText = contentResponse.data.results?.[0]?.text;

            if (!resultText) {
                throw new Error("Exa.ai failed to retrieve content from the specified URL.");
            }
            return { success: true, answer: resultText };
        } 
        else if (task === 'answer') {
            log.info(`Exa.ai: Running answer using Exa.ai's answer API for: ${query.substring(0, 50)}`);
            
            const answerRequestBody = {
                query: query,
                numResults: advancedOptions?.numResults || 10, 
                includeDomains: (advancedOptions?.domainIncludes || []).map(d => d.trim()).filter(d => d.length > 0),
                excludeDomains: (advancedOptions?.domainExcludes || []).map(d => d.trim()).filter(d => d.length > 0),
                startPublishedDate: advancedOptions?.startDate || null,
                endPublishedDate: advancedOptions?.endDate || null,
                text: true,
                highlights: true,
                model: "exa",
                type: "auto"
            };
            
            const response = await axios.post(answerUrl, answerRequestBody, { headers });
            
            if (response.data && response.data.answer) {
                const sources = response.data.sources || [];
                const sourceUrls = sources.map(s => s.url).filter(url => url);
                
                return { 
                    success: true, 
                    answer: response.data.answer,
                    sourceUrls: sourceUrls
                };
            } else {
                return { success: true, answer: "Exa.ai could not find an answer for this question." };
            }
        } 
        else if (task === 'similar') {
            log.info(`Exa.ai: Running findSimilar for: ${query.substring(0, 50)}`);
            const response = await axios.post(findSimilarUrl, { url: query, numResults: 5 }, { headers });
            return { success: true, results: response.data.results || [] };
        }
        
        throw new Error(`Invalid or unsupported Exa.ai task: ${task}`);

    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        log.error(`Exa.ai Task Failed (${task}): ${errorMessage} (Status: ${statusCode})`);
        if (error.response?.data) {
            log.error(`Exa.ai Error details: ${JSON.stringify(error.response.data)}`);
        }
        return { success: false, error: errorMessage };
    }
}

module.exports = { handleExaWebTask };