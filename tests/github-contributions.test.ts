import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isValidGitHubUsername,
    parseGitHubActivityHtml,
    parseGitHubContributionsHtml,
} from '../api/github-contributions.ts';

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

test('parseGitHubActivityHtml extracts commits, created repos, private rollups, and pagination', () => {
    const sampleActivityHtml = `
        <div class="contribution-activity-listing">
            <h3>November <span>2026</span></h3>
            <div data-view-component="true" class="TimelineItem">
                <div class="TimelineItem-badge"><svg class="octicon octicon-repo-push"></svg></div>
                <div class="TimelineItem-body">
                    <details open>
                        <summary><span>Created 15 commits in 2 repositories</span></summary>
                        <ul>
                            <li class="d-flex">
                                <a href="/BimaSatyaM/ACTS-Web">BimaSatyaM/ACTS-Web</a>
                                <a href="/BimaSatyaM/ACTS-Web/commits">9 commits</a>
                                <span style="width: 60%"></span>
                            </li>
                        </ul>
                    </details>
                </div>
            </div>
            <div data-view-component="true" class="TimelineItem">
                <div class="TimelineItem-badge"><svg class="octicon octicon-repo"></svg></div>
                <div class="TimelineItem-body">
                    <details open>
                        <summary><span>Created 1 repository</span></summary>
                        <ul>
                            <li class="d-flex">
                                <a href="/BimaSatyaM/ACTS-Web">BimaSatyaM/ACTS-Web</a>
                                <span class="repo-language-color" style="background-color: #3178c6"></span>
                                <span itemprop="programmingLanguage">TypeScript</span>
                                <time>Nov 11</time>
                            </li>
                        </ul>
                    </details>
                </div>
            </div>
            <div data-view-component="true" class="TimelineItem">
                <div class="TimelineItem-badge"><svg class="octicon octicon-lock"></svg></div>
                <div class="TimelineItem-body">
                    <span class="f4">10 contributions in private repositories</span>
                    <span class="float-right pt-1">Nov 11 &ndash; Nov 12</span>
                </div>
            </div>
            <form class="ajax-pagination-form" action="/BimaSatyaM?tab=overview&amp;from=2026-10-01&amp;to=2026-10-31&amp;include_header=no">
                <button type="submit">Show more activity</button>
            </form>
        </div>
    `;

    const parsed = parseGitHubActivityHtml(sampleActivityHtml);
    assert.ok(parsed);
    assert.equal(parsed.month, 'November 2026');
    assert.equal(parsed.hasMore, true);
    assert.equal(parsed.nextFrom, '2026-10-01');
    assert.equal(parsed.nextTo, '2026-10-31');
    assert.equal(parsed.items.length, 3);
    assert.equal(parsed.items[0].type, 'commits');
    assert.equal(parsed.items[0].repos?.[0].percentage, 60);
    assert.equal(parsed.items[1].type, 'repo_created');
    assert.equal(parsed.items[1].createdRepo?.language, 'TypeScript');
    assert.equal(parsed.items[1].createdRepo?.languageColor, '#3178c6');
    assert.equal(parsed.items[2].type, 'private');
    assert.equal(parsed.items[2].title, '10 contributions in private repositories');
    assert.equal(parsed.items[2].date, 'Nov 11 - Nov 12');
});
