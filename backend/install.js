
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function install() {
    const prisma = new PrismaClient();

    try {
        // 1. Load module definition
        const moduleJsonPath = path.join(__dirname, 'module.json');
        if (!fs.existsSync(moduleJsonPath)) {
            throw new Error(`module.json not found at ${moduleJsonPath}`);
        }
        const moduleDef = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));

        console.log(`📦 Installing module: ${moduleDef.displayName || moduleDef.name} (${moduleDef.name})...`);

        // 2. Upsert Module
        console.log('🔄 Updating module registration...');
        const moduleData = {
            slug: moduleDef.name,
            name: moduleDef.displayName || moduleDef.name,
            version: moduleDef.version,
            description: moduleDef.description,
            status: 'active',
            hasBackend: true,
            hasFrontend: true,
            installedAt: new Date()
        };

        const moduleRecord = await prisma.module.upsert({
            where: { slug: moduleDef.name },
            update: moduleData,
            create: moduleData
        });
        console.log(`✅ Module registered with ID: ${moduleRecord.id}`);

        // 3. Upsert Menus
        if (moduleDef.menus && Array.isArray(moduleDef.menus)) {
            console.log('🔄 Updating menus...');
            for (const menu of moduleDef.menus) {
                // Check if menu exists by route and module
                const existingMenu = await prisma.moduleMenu.findFirst({
                    where: {
                        moduleId: moduleRecord.id,
                        route: menu.route
                    }
                });

                const menuData = {
                    moduleId: moduleRecord.id,
                    label: menu.label,
                    route: menu.route,
                    icon: menu.icon,
                    order: menu.order,
                    isUserMenu: true
                };

                if (existingMenu) {
                    await prisma.moduleMenu.update({
                        where: { id: existingMenu.id },
                        data: menuData
                    });
                    console.log(`   + Menu "${menu.label}" updated.`);
                } else {
                    await prisma.moduleMenu.create({
                        data: menuData
                    });
                    console.log(`   + Menu "${menu.label}" created.`);
                }
            }
        }

        console.log('🎉 Module installation completed successfully!');

    } catch (error) {
        console.error('❌ Installation failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

install();
