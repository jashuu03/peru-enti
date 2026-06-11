/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} fields - Field names to include
 * @returns {string} CSV formatted string
 */
const convertToCSV = (data, fields) => {
  if (!data || data.length === 0) return '';

  const headers = fields.map(f => f.label || f.value).join(',');
  const fieldValues = fields.map(f => f.value);

  const rows = data.map(item => {
    return fieldValues.map(field => {
      let value = field.split('.').reduce((obj, key) => obj?.[key], item);
      
      if (value === null || value === undefined) value = '';
      if (typeof value === 'string') {
        // Escape commas and quotes
        value = `"${value.replace(/"/g, '""')}"`;
      }
      if (value instanceof Date) {
        value = value.toISOString();
      }
      
      return value;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
};

module.exports = { convertToCSV };
