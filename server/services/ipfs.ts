import axios from 'axios';
import FormData from 'form-data';

const PINATA_API_URL = 'https://api.pinata.cloud';

export async function uploadToIPFS(buffer: Buffer): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: `file-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    });

    const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
      }
    });

    return response.data.IpfsHash; // This is the IPFS hash (CID)
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

export async function getFromIPFS(hash: string): Promise<Buffer> {
  try {
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('IPFS retrieval error:', error);
    throw new Error('Failed to retrieve from IPFS');
  }
}
