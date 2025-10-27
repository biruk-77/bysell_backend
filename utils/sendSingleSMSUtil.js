// test-project/utils/sendSingleSMSUtil.js
// Geez SMS Integration for Ethiopian SMS Service
const axios = require('axios');
const FormData = require('form-data');

function createSingleSMSUtil({ token }) {
  const GEEZ_SMS_API_URL = 'https://api.geezsms.com/api/v1/sms/send';
  
  async function sendSingleSMS({ phone, msg, shortcode_id, callback }) {
    try {
      console.log('📱 Sending SMS via Geez SMS API...');
      console.log('  Phone:', phone);
      console.log('  Message:', msg);
      
      // Create FormData (Geez SMS requires form-data format)
      const formData = new FormData();
      formData.append('token', token);
      formData.append('phone', phone);
      formData.append('msg', msg);
      
      if (shortcode_id) {
        formData.append('shortcode_id', shortcode_id);
      }
      
      if (callback) {
        formData.append('callback', callback);
      }

      // Send request to Geez SMS API
      const response = await axios.post(GEEZ_SMS_API_URL, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('✅ SMS sent successfully!');
      console.log('  Response:', response.data);
      
      return {
        success: true,
        data: {
          api_log_id: response.data.api_log_id || 'unknown',
          phone: response.data.phone,
          message: response.data.message,
          status: response.data.message_status || 'sent'
        }
      };
    } catch (error) {
      console.error('❌ Geez SMS Error:', error.message);
      
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', error.response.data);
        throw new Error(
          error.response.data.message || 
          error.response.data.error ||
          `SMS API Error: ${error.response.status}`
        );
      } else if (error.request) {
        console.error('  No response from SMS API');
        throw new Error('SMS service is not responding. Please try again.');
      } else {
        throw new Error(`SMS service error: ${error.message}`);
      }
    }
  }

  return { sendSingleSMS };
}

module.exports = createSingleSMSUtil;
