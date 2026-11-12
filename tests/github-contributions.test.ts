import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidGitHubUsername, parseGitHubContributionsHtml } from '../api/github-contributions.ts';

test('isValidGitHubUsername rejects traversal and invalid handles', () => {
    assert.equal(isValidGitHubUsername('BimaSatyaM'), true);
    assert.equal(isValidGitHubUsername('a'), true);
    assert.equal(isValidGitHubUsername(''), false);
    assert.equal(isValidGitHubUsername('../etc'), false);
    assert.equal(isValidGitHubUsername('user/repo'), false);
    assert.equal(isValidGitHubUsername('-leading'), false);
    assert.equal(isValidGitHubUsername('trailing-'), false);
});

test('parseGitHubContributionsHtml sorts out-of-order cells and extracts tooltip counts', () => {
    const sampleHtml = `
        <h2>1,235 contributions in the last year</h2>
        <table>
            <tr>
                <td id="day-2" data-level="4" data-date="2026-11-12"></td>
                <td data-date="2026-11-10" id="day-0" data-level="0"></td>
                <td data-level="1" data-date="2026-11-11" id="day-1"></td>
            </tr>
        </table>
        <tool-tip for="day-0">No contributions on November 10th.</tool-tip>
        <tool-tip for="day-1">1 contribution on November 11th.</tool-tip>
        <tool-tip for="day-2">1,234 contributions on November 12th.</tool-tip>
    `;

    const parsed = parseGitHubContributionsHtml(sampleHtml);
    assert.equal(parsed.total.lastYear, 1235);
    assert.deepEqual(parsed.contributions, [
        { date: '2026-11-10', count: 0, level: 0 },
        { date: '2026-11-11', count: 1, level: 1 },
        { date: '2026-11-12', count: 1234, level: 4 },
    ]);
});
