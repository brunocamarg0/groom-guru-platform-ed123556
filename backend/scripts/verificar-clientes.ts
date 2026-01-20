import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function verify() {
    try {
        const count = await prisma.cliente.count();
        const outputPath = path.join(__dirname, 'cliente_count.txt');
        fs.writeFileSync(outputPath, `Count: ${count}`);
        console.log(`Count: ${count}`);
    } catch (e) {
        const outputPath = path.join(__dirname, 'cliente_error.txt');
        fs.writeFileSync(outputPath, `Error: ${e}`);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
