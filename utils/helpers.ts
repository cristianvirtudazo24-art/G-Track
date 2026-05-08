function normalizeHtml(raw: string) {
  return raw
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<\s*p\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

export function parseBroadcastMessage(rawMessage: string | null | undefined) {
  const raw = String(rawMessage ?? '').trim();
  const message = normalizeHtml(raw);

  if (!message) {
    return {
      subject: 'Admin Broadcast',
      body: '',
    };
  }

  const normalized = message.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const subjectMatch = normalized.match(/^\s*Subject\s*:\s*(.+)$/im);
  if (subjectMatch) {
    const subject = subjectMatch[1].trim();
    const body = normalized.slice(subjectMatch[0].length).trim();
    return {
      subject: subject || 'Admin Broadcast',
      body: body || subject,
    };
  }

  const pieces = normalized.split(/\n\n+/);
  if (pieces.length > 1) {
    const [firstLine, ...rest] = pieces;
    const body = rest.join('\n\n').trim();
    return {
      subject: firstLine.trim() || 'Admin Broadcast',
      body: body || firstLine.trim(),
    };
  }

  const lines = normalized.split('\n');
  if (lines.length > 1) {
    const [firstLine, ...rest] = lines;
    const body = rest.join('\n').trim();
    return {
      subject: firstLine.trim() || 'Admin Broadcast',
      body: body || firstLine.trim(),
    };
  }

  return {
    subject: message,
    body: message,
  };
}
