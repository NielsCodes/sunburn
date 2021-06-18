import {Storage} from '@google-cloud/storage';
import {createCanvas, loadImage, registerFont} from 'canvas';
import fs from 'fs';

require('dotenv').config();

const storage = new Storage();
const bucketName = process.env.FILE_BUCKET;
const bucket = storage.bucket(bucketName!);

registerFont('./assets/Ticketing.ttf', {family: 'Ticketing'});

/**
 * Create a vertical ticket with user defined variables
 *
 * Creates canvas with background image with variables overlaid
 *
 * Uploads the file to Google Cloud Storage and retrieves a signed URL for download
 *
 * @param name UGC: Name of user
 * @param departing UGC: Departing location of user
 * @param destination UGC: Destination location of user
 * @param index nth presave
 * @param id ID to link to front-end
 */
export const createVerticalImage = async (
  name: string,
  departing: string,
  destination: string,
  index: number,
  id: string
) => {
  const backColor = '#232323';
  const textColor = '#E9E7DA';

  const canvas = createCanvas(1080, 1920);
  const ctx = canvas.getContext('2d');

  const ticket = await loadImage('./assets/ticket-vertical.jpg');

  ctx.drawImage(ticket, 0, 0);
  ctx.font = '52px Ticketing';
  ctx.textBaseline = 'top';

  // DRAW NAME
  const nameWidth = ctx.measureText(name).width;
  ctx.fillStyle = backColor;
  ctx.fillRect(246, 606, nameWidth, 44);
  ctx.fillStyle = textColor;
  ctx.fillText(name, 248, 600);

  // DRAW BARCODE
  const barcode = createBarcode(index);
  const barcodeWidth = ctx.measureText(barcode).width;
  ctx.fillStyle = backColor;
  ctx.fillRect(246, 1398, barcodeWidth, 44);
  ctx.fillStyle = textColor;
  ctx.fillText(barcode, 248, 1392);

  // DRAW DEPARTING
  ctx.fillStyle = backColor;
  ctx.fillText(departing, 246, 885);

  // DRAW DESTINATION
  ctx.fillStyle = backColor;
  ctx.fillText(destination, 246, 1078);

  const buffer = canvas.toBuffer('image/jpeg');
  const filename = `./output/vert-${id}.jpg`;
  fs.writeFileSync(filename, buffer);

  await bucket.upload(filename, {
    destination: `tickets/${id}/DROELOE-ticket-vertical.jpg`,
  });

  fs.unlinkSync(filename);

  return;
};

/**
 * Create a horizontal ticket with user defined variables
 *
 * Creates canvas with background image with variables overlaid
 *
 * Uploads the file to Google Cloud Storage and retrieves a signed URL for download
 *
 * @param name UGC: Name of user
 * @param departing UGC: Departing location of user
 * @param destination UGC: Destination location of user
 * @param index nth presave
 * @param id ID to link to front-end
 */
export const createHorizontalImage = async (
  name: string,
  departing: string,
  destination: string,
  index: number,
  id: string
) => {
  const backColor = '#232323';
  const textColor = '#597BE3';

  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  const ticket = await loadImage('./assets/ticket-horizontal.jpg');

  ctx.drawImage(ticket, 0, 0);
  ctx.font = '52px Ticketing';
  ctx.textBaseline = 'top';

  // DRAW NAME
  const nameWidth = ctx.measureText(name).width;
  ctx.fillStyle = backColor;
  ctx.fillRect(780, 96, nameWidth, 44);
  ctx.fillStyle = textColor;
  ctx.fillText(name, 782, 90);

  // DRAW BARCODE
  const barcode = createBarcode(index);
  ctx.fillStyle = backColor;
  ctx.fillText(barcode, 505, 950);

  // DRAW DEPARTING
  ctx.fillStyle = backColor;
  ctx.fillText(departing, 505, 468);

  // DRAW DESTINATION
  ctx.fillStyle = backColor;
  ctx.fillText(destination, 505, 668);

  const buffer = canvas.toBuffer('image/jpeg');
  const filename = `./output/hor-${id}.jpg`;
  fs.writeFileSync(filename, buffer);

  await bucket.upload(filename, {
    destination: `tickets/${id}/DROELOE-ticket-horizontal.jpg`,
  });

  fs.unlinkSync(filename);

  return;
};

/**
 * Get signed URLs for all files for the given data ID
 * @param id ID that is used to connect to right user
 */
export const getSignedURLs = async (id: string) => {
  const expiration = Date.now() + 604800;
  const urls: {vertical?: string; horizontal?: string} = {};

  const [files] = await bucket.getFiles({prefix: `tickets/${id}`});
  for (const file of files) {
    const [signedURL] = await file.getSignedUrl({
      action: 'read',
      expires: expiration,
      version: 'v4',
    });

    if (file.name.includes('vertical')) {
      urls.vertical = signedURL;
    } else {
      urls.horizontal = signedURL;
    }
  }

  return urls;
};

/**
 * Get a horizontal ticket's file data from GCS by its uuid
 * @param id the presave UUID
 * @returns the raw file data
 */
export const getFileData = async (id: string) => {
  const fileDownload = await bucket
    .file(`tickets/${id}/DROELOE-ticket-horizontal.jpg`)
    .download();
  return fileDownload[0];
};

/**
 * Create barcode string from an ID
 * @param index ID at the end of the barcode
 * @returns Barcode string in 0000 0000 0000 0012 format
 */
const createBarcode = (index: number) => {
  const baseString = '0000000000000000';
  const code = `${baseString}${index}`.slice(-16);
  const elements = code.match(/.{4}/g);
  return `${elements![0]} ${elements![1]} ${elements![2]} ${elements![3]}`;
};
