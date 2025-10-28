export function normToPixels(bbox, pageRect) {
  // bbox: { x_center, y_center, width, height }
  // pageRect: { width, height }
  const xc = Number(bbox.x_center ?? 0);
  const yc = Number(bbox.y_center ?? 0);
  const bw = Number(bbox.width ?? 0);
  const bh = Number(bbox.height ?? 0);

  const x = (xc - bw / 2) * pageRect.width;
  const y = (yc - bh / 2) * pageRect.height;
  const width = bw * pageRect.width;
  const height = bh * pageRect.height;
  return { x, y, width, height };
}

export function ocrToPdfPixels(bbox, imageSize, pdfSize) {
  // bbox: { x_center, y_center, width, height } (normalized)
  // imageSize: { width: 4767, height: 3367 }
  // pdfSize: { width: pageRect.width, height: pageRect.height }
  const xc = Number(bbox.x_center ?? 0);
  const yc = Number(bbox.y_center ?? 0);
  const bw = Number(bbox.width ?? 0);
  const bh = Number(bbox.height ?? 0);

  // Convert normalized to image pixels
  const x_img = (xc - bw / 2) * imageSize.width;
  const y_img = (yc - bh / 2) * imageSize.height;
  const w_img = bw * imageSize.width;
  const h_img = bh * imageSize.height;

  // Scale image pixels to PDF rendered pixels
  const x_pdf = x_img * (pdfSize.width / imageSize.width);
  const y_pdf = y_img * (pdfSize.height / imageSize.height);
  const w_pdf = w_img * (pdfSize.width / imageSize.width);
  const h_pdf = h_img * (pdfSize.height / imageSize.height);

  return { x: x_pdf, y: y_pdf, width: w_pdf, height: h_pdf };
}