import type { IncomingMessage, ServerResponse } from 'node:http';

const RECIPIENT_EMAIL = 'bimasatyamahendra07@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactBody {
    name?: unknown;
    email?: unknown;
    message?: unknown;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<ContactBody> {
    const maybeReq = req as IncomingMessage & { body?: unknown };
    if (maybeReq.body && typeof maybeReq.body === 'object') {
        return maybeReq.body as ContactBody;
    }
    if (typeof maybeReq.body === 'string') {
        return JSON.parse(maybeReq.body) as ContactBody;
    }

    const chunks: Buffer[] = [];
    let totalBytes = 0;
    for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
        totalBytes += buf.length;
        if (totalBytes > 32 * 1024) {
            throw new Error('Payload too large');
        }
        chunks.push(buf);
    }

    if (chunks.length === 0) return {};
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as ContactBody;
}

function validateContactInput(raw: ContactBody) {
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const email = typeof raw.email === 'string' ? raw.email.trim() : '';
    const message = typeof raw.message === 'string' ? raw.message.trim() : '';

    if (!name || name.length > 120) {
        return { error: 'Please enter a valid name (1-120 characters).' };
    }
    if (!email || email.length > 160 || !EMAIL_REGEX.test(email)) {
        return { error: 'Please enter a valid email address.' };
    }
    if (!message || message.length > 4000) {
        return { error: 'Please enter a message (1-4000 characters).' };
    }

    return { name, email, message };
}

async function sendViaResend(apiKey: string, name: string, email: string, message: string) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Portfolio Contact <onboarding@resend.dev>',
            to: [RECIPIENT_EMAIL],
            reply_to: email,
            subject: `Portfolio Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        }),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Resend HTTP ${response.status}: ${detail}`);
    }
}

async function sendViaWeb3Forms(accessKey: string, name: string, email: string, message: string) {
    const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            access_key: accessKey,
            subject: `Portfolio Message from ${name}`,
            from_name: name,
            name,
            email,
            replyto: email,
            message,
        }),
    });

    const data = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (!response.ok || data.success === false) {
        throw new Error(data.message || `Web3Forms HTTP ${response.status}`);
    }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        sendJson(res, 405, { ok: false, error: 'Method not allowed' });
        return;
    }

    let rawBody: ContactBody;
    try {
        rawBody = await readBody(req);
    } catch {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON payload' });
        return;
    }

    const validated = validateContactInput(rawBody);
    if ('error' in validated) {
        sendJson(res, 400, { ok: false, error: validated.error });
        return;
    }

    const resendKey = process.env.RESEND_API_KEY?.trim();
    const web3FormsKey = process.env.WEB3FORMS_ACCESS_KEY?.trim();

    if (!resendKey && !web3FormsKey) {
        sendJson(res, 503, {
            ok: false,
            error: 'Email service is not configured yet (missing RESEND_API_KEY or WEB3FORMS_ACCESS_KEY).',
        });
        return;
    }

    try {
        if (resendKey) {
            await sendViaResend(resendKey, validated.name, validated.email, validated.message);
        } else if (web3FormsKey) {
            await sendViaWeb3Forms(web3FormsKey, validated.name, validated.email, validated.message);
        }

        sendJson(res, 200, { ok: true });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to send email';
        sendJson(res, 502, { ok: false, error: msg });
    }
}
