// src/utils/qrCode.js
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== QR CODE CONFIGURATION ====================
const QR_CONFIG = {
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  errorCorrectionLevel: 'H',
};

// ==================== GENERATE QR CODE ====================
export const generateQRCode = async (data, fileName) => {
  try {
    // Ensure folder exists
    const qrFolder = path.join(__dirname, '../../uploads/qrcodes');
    if (!fs.existsSync(qrFolder)) {
      fs.mkdirSync(qrFolder, { recursive: true });
    }

    // File path
    const filePath = path.join(qrFolder, fileName);

    // Generate QR code image
    await QRCode.toFile(filePath, data, QR_CONFIG);

    // Return relative path for database
    return `/uploads/qrcodes/${fileName}`;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

// ==================== GENERATE QR CODE AS BASE64 ====================
export const generateQRCodeBase64 = async (data) => {
  try {
    const qrCode = await QRCode.toDataURL(data, QR_CONFIG);
    return qrCode;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

// ==================== GENERATE QR CODE AS BUFFER ====================
export const generateQRCodeBuffer = async (data) => {
  try {
    const buffer = await QRCode.toBuffer(data, QR_CONFIG);
    return buffer;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

// ==================== DELETE QR CODE FILE ====================
export const deleteQRCodeFile = async (qrCodePath) => {
  try {
    if (!qrCodePath) return;

    const filePath = path.join(__dirname, '../../', qrCodePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Delete QR code error:', error);
  }
};

// ==================== UPDATE QR CODE ====================
export const updateQRCode = async (studentId, studentData) => {
  try {
    // Delete old QR code if exists
    const oldQRPath = path.join(__dirname, '../../uploads/qrcodes', `${studentId}.png`);
    if (fs.existsSync(oldQRPath)) {
      fs.unlinkSync(oldQRPath);
    }

    // Generate new QR code
    const qrData = JSON.stringify(studentData);
    const fileName = `${studentId}.png`;
    
    return await generateQRCode(qrData, fileName);
  } catch (error) {
    console.error('Update QR code error:', error);
    throw new Error(`Failed to update QR code: ${error.message}`);
  }
};