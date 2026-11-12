import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import handler from '../api/coding-status.ts';

test('coding-status handler handles GET and returns pure WakaTime status structure', async () => {
    const server = http.createServer((req, res) => void handler(req, res));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as { port: number };
    const base = `http://127.0.0.1:${address.port}`;

    try {
        const getRes = await fetch(`${base}/api/coding-status`);
        assert.equal(getRes.status, 200);
        assert.equal(getRes.headers.get('content-type'), 'application/json; charset=utf-8');
        const json = await getRes.json();

        assert.equal(typeof json.isCoding, 'boolean');
        assert.ok(json.project === null || typeof json.project === 'string');
        assert.ok(json.language === null || typeof json.language === 'string');
        assert.equal(typeof json.totalHoursEn, 'string');
        assert.equal(typeof json.totalHoursId, 'string');
        assert.equal(typeof json.totalDigital, 'string');
        assert.equal(typeof json.totalSeconds, 'number');
        assert.equal(typeof json.aiSessions, 'number');
        assert.ok(Array.isArray(json.languages));
        assert.ok(Array.isArray(json.projects));
        assert.equal(typeof json.dateText, 'string');
        assert.equal(typeof json.lastUpdate, 'string');

        const postRes = await fetch(`${base}/api/coding-status`, { method: 'POST' });
        assert.equal(postRes.status, 405);

        const headRes = await fetch(`${base}/api/coding-status`, { method: 'HEAD' });
        assert.equal(headRes.status, 200);
    } finally {
        server.close();
    }
});
