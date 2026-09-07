export const clientsConfig = {
  maxLQ: {
    name: 'maxLQ',
    fontFamily: 'Verdana, Arial, Calibri, sans-serif',
    adTypes: {
      Textanzeige: { fontSize: '14px', lineHeight: '20px', headingFontSize: '18px', headingLineHeight: '24px', maxHeight: '200px' },
      Bildanzeige: { fontSize: '16px', lineHeight: '22px', headingFontSize: null, headingLineHeight: null, maxHeight: '600px' },
      Redlink: { fontSize: '16px', lineHeight: '22px', headingFontSize: '22px', headingLineHeight: '28px', maxHeight: '1200px' },
      Linktipp: { fontSize: '16px', lineHeight: '22px', headingFontSize: '22px', headingLineHeight: '28px', maxHeight: null },
    }
  },
  gevestor: {
    name: 'Gevestor/Investor',
    fontFamily: 'Arial, sans-serif',
    adTypes: {
      Textanzeige: { fontSize: '14px', lineHeight: '18px', headingFontSize: '18px', headingLineHeight: '22px', maxHeight: '200px' },
      Bildanzeige: { fontSize: '16px', lineHeight: '20px', headingFontSize: null, headingLineHeight: null, maxHeight: '600px' },
      Redlink: { fontSize: '16px', lineHeight: '20px', headingFontSize: '22px', headingLineHeight: '26px', maxHeight: '1200px' },
      Linktipp: { fontSize: '16px', lineHeight: '20px', headingFontSize: '22px', headingLineHeight: '26px', maxHeight: null },
    }
  },
  mediaforwork: {
    name: 'mediaforwork',
    fontFamily: 'Arial, sans-serif',
    adTypes: {
      Textanzeige: { fontSize: '14px', lineHeight: '18px', headingFontSize: '18px', headingLineHeight: '22px', maxHeight: '200px' },
      Bildanzeige: { fontSize: '16px', lineHeight: '20px', headingFontSize: null, headingLineHeight: null, maxHeight: '600px' },
      Redlink: { fontSize: '16px', lineHeight: '20px', headingFontSize: '22px', headingLineHeight: '26px', maxHeight: '1200px' },
      Linktipp: { fontSize: '16px', lineHeight: '20px', headingFontSize: '22px', headingLineHeight: '26px', maxHeight: null },
    }
  }
};

export const getPresetHtml = (clientKey: string, adTypeKey: string) => {
  const client = (clientsConfig as any)[clientKey];
  if (!client) return '';
  const adType = client.adTypes[adTypeKey];
  if (!adType) return '';

  const { fontFamily } = client;
  const { fontSize, lineHeight, headingFontSize, headingLineHeight, maxHeight } = adType;
  
  const heightStyle = maxHeight ? `max-height: ${maxHeight};` : '';
  const noShy = clientKey === 'mediaforwork' ? '<!-- Kein &shy; verwenden -->' : '';

  if (adTypeKey === 'Textanzeige' || adTypeKey === 'Redlink' || adTypeKey === 'Linktipp') {
    return `
<table width="100%" border="0" cellspacing="0" cellpadding="2" align="center" style="font-family: ${fontFamily}; background-color: #FFFFFF; color: #000000; text-align: left; max-width:600px; ${heightStyle}">
  <tbody>
    <tr>
      <td>
        ${noShy}
        <div style="font-size: ${headingFontSize}; line-height: ${headingLineHeight}; font-weight: bold; margin-bottom: 8px;">Überschrift</div>
        <div style="font-size: ${fontSize}; line-height: ${lineHeight};">Fließtext hier eingeben...</div>
      </td>
    </tr>
  </tbody>
</table><br/>`;
  }

  if (adTypeKey === 'Bildanzeige') {
    return `
<table width="100%" border="0" cellspacing="0" cellpadding="2" align="center" style="font-family: ${fontFamily}; background-color: #FFFFFF; color: #000000; text-align: left; max-width:600px; ${heightStyle}">
  <tbody>
    <tr>
      <td>
        ${noShy}
        <img src="https://via.placeholder.com/600x200" width="100%" style="max-width: 600px; display: block; border: 0; margin-bottom: 10px;" alt="Bild" />
        <div style="font-size: ${fontSize}; line-height: ${lineHeight};">Fließtext hier eingeben...</div>
      </td>
    </tr>
  </tbody>
</table><br/>`;
  }

  return '';
};
