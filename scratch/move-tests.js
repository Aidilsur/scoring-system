const fs = require('fs');
const path = require('path');

const files = [
    'lib/scoring/checkMatchWinner.test.ts',
    'lib/scoring/sortStandings.test.ts',
    'lib/scoring/recordPoint.test.ts',
    'lib/scoring/calculateNextMatchScore.test.ts',
    'lib/scoring/recordTiebreakPoint.test.ts',
    'lib/scoring/shouldStartTiebreakGame.test.ts',
    'lib/draw/distributeTeamsToGroups.test.ts',
    'lib/draw/generateGroupDraw.test.ts',
    'lib/draw/generateRoundRobinSchedule.test.ts',
    'lib/bracket/generateBracketPairing.test.ts',
    'lib/bracket/checkGroupStageComplete.test.ts',
    'lib/bracket/checkSemifinalComplete.test.ts',
    'lib/bracket/generateFinalPairing.test.ts'
];

for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file);
    const targetDir = path.join(dir, '__tests__');
    const targetFile = path.join(targetDir, base);

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    let content = fs.readFileSync(file, 'utf8');
    // Replace import from './...' to import from '../...'
    content = content.replace(/from\s+['"]\.\/([^'"]+)['"]/g, "from '../$1'");
    // Also cover require if there are any (unlikely in TS, but just in case)
    content = content.replace(/require\(['"]\.\/([^'"]+)['"]\)/g, "require('../$1')");

    fs.writeFileSync(targetFile, content, 'utf8');
    fs.unlinkSync(file);
    console.log(`Moved ${file} to ${targetFile}`);
}
