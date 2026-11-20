import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import handler from '../api/contact.ts';

test('contact handler validates inputs and delivers via Resend when configured', async () => {
    const server = http.createServer((req, res) => void handler(req, res));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as { port: number };
    const base = `http://127.0.0.1:${address.port}`;

    const origResend = process.env.RESEND_API_KEY;
    const origWeb3 = process.env.WEB3FORMS_ACCESS_KEY;
    const origFetch = globalThis.fetch;

    try {
        // 405 for GET
        const getRes = await origFetch(`${base}/api/contact`);
        assert.equal(getRes.status, 405);

        // 400 for invalid email
        const badRes = await origFetch(`${base}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Bima', email: 'not-an-email', message: 'Hi' }),
        });
        assert.equal(badRes.status, 400);

        // 503 when neither email provider key is configured
        delete process.env.RESEND_API_KEY;
        delete process.env.WEB3FORMS_ACCESS_KEY;
        const unconfiguredRes = await origFetch(`${base}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test', email: 'test@example.com', message: 'Hello' }),
        });
        assert.equal(unconfiguredRes.status, 503);

        // 200 when RESEND_API_KEY is configured and Resend accepts
        process.env.RESEND_API_KEY = 're_test_key';
        let capturedPayload: Record<string, unknown> | null = null;
        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url === 'https://api.resend.com/emails') {
                capturedPayload = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
                return new Response(JSON.stringify({ id: 'email_123' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return origFetch(input, init);
        }) as typeof fetch;

        const okRes = await origFetch(`${base}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Visitor', email: 'visitor@example.com', message: 'Nice portfolio!' }),
        });
        assert.equal(okRes.status, 200);
        const okJson = (await okRes.json()) as { ok: boolean };
        assert.equal(okJson.ok, true);
        assert.deepEqual(capturedPayload?.to, ['bimasatyamahendra07@gmail.com']);
        assert.equal(capturedPayload?.reply_to, 'visitor@example.com');
    } finally {
        globalThis.fetch = origFetch;
        if (origResend === undefined) delete process.env.RESEND_API_KEY;
        else process.env.RESEND_API_KEY = origResend;
        if (origWeb3 === undefined) delete process.env.WEB3FORMS_ACCESS_KEY;
        else process.env.WEB3FORMS_ACCESS_KEY = origWeb3;
        await new Promise((resolve) => server.close(resolve));
    }
});
