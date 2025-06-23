const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 맥상 정보 조회 API
router.get('/info/:pulseType', async (req, res) => {
  try {
    const { pulseType } = req.params;
    console.log(`[API] Received request for pulseType: "${pulseType}"`);
    
    const templatesDir = path.join(__dirname, '../../pulse_templates');
    const files = await fs.readdir(templatesDir);
    
    console.log('[API] Searching in files:', files.join(', '));

    const pulseFile = files.find(file => {
      const nameOnly = file.replace(/pulse_\d{3}_/, '').replace('.json', '');
      console.log(`[API] Checking file: "${file}" -> Parsed name: "${nameOnly}"`);
      return nameOnly === pulseType;
    });

    console.log(`[API] Matched file: ${pulseFile || 'None'}`);
    
    if (!pulseFile) {
      return res.status(404).json({
        success: false,
        message: `맥상 "${pulseType}"에 대한 정보를 찾을 수 없습니다.`
      });
    }
    
    // 파일 읽기
    const filePath = path.join(templatesDir, pulseFile);
    const pulseData = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    res.json({
      success: true,
      data: pulseData
    });
    
  } catch (error) {
    console.error('맥상 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 모든 맥상 목록 조회 API
router.get('/list', async (req, res) => {
  try {
    const templatesDir = path.join(__dirname, '../../pulse_templates');
    const files = await fs.readdir(templatesDir);
    
    const pulseList = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(templatesDir, file);
        const pulseData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        pulseList.push({
          pulseType: pulseData.pulseType,
          hanja: pulseData.hanja,
          physiology: pulseData.physiology
        });
      }
    }
    
    res.json({
      success: true,
      data: pulseList
    });
    
  } catch (error) {
    console.error('맥상 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 맥상 검색 API
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: '검색어를 입력해주세요.'
      });
    }
    
    const templatesDir = path.join(__dirname, '../../pulse_templates');
    const files = await fs.readdir(templatesDir);
    
    const searchResults = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(templatesDir, file);
        const pulseData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // 맥상 타입, 한자, 설명에서 검색
        const searchText = `${pulseData.pulseType} ${pulseData.hanja || ''} ${pulseData.description || ''}`.toLowerCase();
        
        if (searchText.includes(query.toLowerCase())) {
          searchResults.push({
            pulseType: pulseData.pulseType,
            hanja: pulseData.hanja,
            physiology: pulseData.physiology,
            description: pulseData.description
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: searchResults
    });
    
  } catch (error) {
    console.error('맥상 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 