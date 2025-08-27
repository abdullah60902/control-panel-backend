function extractPublicIdFromUrl(url) {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0]; // extension hatao
  return publicId;
}

module.exports = extractPublicIdFromUrl;
