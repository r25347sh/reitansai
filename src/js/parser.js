export function stripScripts(html) {
  return String(html).replace(/<script[\s\S]*?<\/script>/gi, '');
}
