import bwipjs from 'bwip-js';

export async function generateBarcode(text: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
    textsize: 10,
  });
  return png.toString('base64');
}
