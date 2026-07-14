import React from 'react';
import {
    SiHtml5, SiCss, SiJavascript, SiTypescript, SiTailwindcss, SiBootstrap, SiSass,
    SiReact, SiVuedotjs, SiAngular, SiSvelte, SiSolid, SiNextdotjs, SiNuxt,
    SiRemix, SiAstro, SiNodedotjs, SiBun, SiDeno, SiExpress, SiNestjs,
    SiDjango, SiFastapi, SiFlask, SiLaravel, SiSymfony, SiSpringboot,
    SiDotnet, SiRubyonrails, SiPostgresql, SiMysql, SiMariadb,
    SiMongodb, SiApachecassandra, SiRedis, SiVercel, SiNetlify,
    SiRailway, SiRender, SiDocker, SiKubernetes, SiGithubactions, SiGitlab, SiJenkins,
    SiTerraform, SiAnsible, SiSwift, SiKotlin, SiFlutter, SiElectron, SiTauri,
    SiGithub, SiNpm, SiCplusplus, SiC, SiPython, SiGo, SiRust,
    SiElasticsearch, SiGooglecloud, SiMilvus
} from 'react-icons/si';
import { FaAws, FaMicrosoft, FaDatabase } from 'react-icons/fa';

export interface TechItem {
    name: string;
    icon: React.ReactNode;
    color: string;
}

export const AVAILABLE_TECH: TechItem[] = [
    // Languages
    { name: 'HTML5', icon: <SiHtml5 />, color: '#E34F26' },
    { name: 'CSS3', icon: <SiCss />, color: '#1572B6' },
    { name: 'JavaScript', icon: <SiJavascript />, color: '#F7DF1E' },
    { name: 'TypeScript', icon: <SiTypescript />, color: '#3178C6' },
    { name: 'Python', icon: <SiPython />, color: '#3776AB' },
    { name: 'C++', icon: <SiCplusplus />, color: '#00599C' },
    { name: 'C', icon: <SiC />, color: '#A8B9CC' },
    { name: 'Swift', icon: <SiSwift />, color: '#F05138' },
    { name: 'Kotlin', icon: <SiKotlin />, color: '#7F52FF' },
    { name: 'Go', icon: <SiGo />, color: '#00ADD8' },
    { name: 'Rust', icon: <SiRust />, color: '#CE412B' },

    // Frontend Frameworks & CSS
    { name: 'React.js', icon: <SiReact />, color: '#61DAFB' },
    { name: 'Vue.js', icon: <SiVuedotjs />, color: '#4FC08D' },
    { name: 'Angular', icon: <SiAngular />, color: '#DD0031' },
    { name: 'Svelte', icon: <SiSvelte />, color: '#FF3E00' },
    { name: 'SolidJS', icon: <SiSolid />, color: '#76B3E4' },
    { name: 'Next.js', icon: <SiNextdotjs />, color: '#FFFFFF' },
    { name: 'Nuxt.js', icon: <SiNuxt />, color: '#00DC82' },
    { name: 'Remix', icon: <SiRemix />, color: '#E35C5C' },
    { name: 'Astro', icon: <SiAstro />, color: '#FF5D01' },
    { name: 'Tailwind CSS', icon: <SiTailwindcss />, color: '#06B6D4' },
    { name: 'Bootstrap', icon: <SiBootstrap />, color: '#7952B3' },
    { name: 'Sass', icon: <SiSass />, color: '#CC6699' },

    // Backend & Runtimes
    { name: 'Node.js', icon: <SiNodedotjs />, color: '#339933' },
    { name: 'Bun', icon: <SiBun />, color: '#F9F1E7' },
    { name: 'Deno', icon: <SiDeno />, color: '#FFFFFF' },
    { name: 'Express.js', icon: <SiExpress />, color: '#828282' },
    { name: 'NestJS', icon: <SiNestjs />, color: '#E0234E' },
    { name: 'Django', icon: <SiDjango />, color: '#092E20' },
    { name: 'FastAPI', icon: <SiFastapi />, color: '#009688' },
    { name: 'Flask', icon: <SiFlask />, color: '#FFFFFF' },
    { name: 'Laravel', icon: <SiLaravel />, color: '#FF2D20' },
    { name: 'Symfony', icon: <SiSymfony />, color: '#FFFFFF' },
    { name: 'Spring Boot', icon: <SiSpringboot />, color: '#6DB33F' },
    { name: 'ASP.NET Core', icon: <SiDotnet />, color: '#512BD4' },
    { name: 'Ruby on Rails', icon: <SiRubyonrails />, color: '#CC0000' },

    // Databases
    { name: 'PostgreSQL', icon: <SiPostgresql />, color: '#4169E1' },
    { name: 'MySQL', icon: <SiMysql />, color: '#4479A1' },
    { name: 'MariaDB', icon: <SiMariadb />, color: '#003545' },
    { name: 'Microsoft SQL Server', icon: <FaDatabase />, color: '#CC292B' },
    { name: 'MongoDB', icon: <SiMongodb />, color: '#47A248' },
    { name: 'Cassandra', icon: <SiApachecassandra />, color: '#1287B1' },
    { name: 'DynamoDB', icon: <FaDatabase />, color: '#4053D6' },
    { name: 'Redis', icon: <SiRedis />, color: '#DC382D' },
    { name: 'Memcached', icon: <FaDatabase />, color: '#00B0FF' },
    { name: 'Elasticsearch', icon: <SiElasticsearch />, color: '#005571' },
    { name: 'Pinecone', icon: <FaDatabase />, color: '#0A85EA' },
    { name: 'Milvus', icon: <SiMilvus />, color: '#00FFB2' },

    // Cloud & Platforms
    { name: 'AWS', icon: <FaAws />, color: '#FF9900' },
    { name: 'Google Cloud Platform', icon: <SiGooglecloud />, color: '#4285F4' },
    { name: 'Microsoft Azure', icon: <FaMicrosoft />, color: '#0089D6' },
    { name: 'Vercel', icon: <SiVercel />, color: '#FFFFFF' },
    { name: 'Netlify', icon: <SiNetlify />, color: '#00C7B7' },
    { name: 'Railway', icon: <SiRailway />, color: '#FFFFFF' },
    { name: 'Render', icon: <SiRender />, color: '#46E3B7' },

    // DevOps
    { name: 'Docker', icon: <SiDocker />, color: '#2496ED' },
    { name: 'Kubernetes', icon: <SiKubernetes />, color: '#326CE5' },
    { name: 'GitHub Actions', icon: <SiGithubactions />, color: '#2088FF' },
    { name: 'GitLab CI', icon: <SiGitlab />, color: '#FC6D26' },
    { name: 'Jenkins', icon: <SiJenkins />, color: '#D24939' },
    { name: 'Terraform', icon: <SiTerraform />, color: '#7B42BC' },
    { name: 'Ansible', icon: <SiAnsible />, color: '#EE0000' },

    // Mobile & Desktop Frameworks
    { name: 'Flutter', icon: <SiFlutter />, color: '#02569B' },
    { name: 'React Native', icon: <SiReact />, color: '#61DAFB' },
    { name: 'Electron', icon: <SiElectron />, color: '#47848F' },
    { name: 'Tauri', icon: <SiTauri />, color: '#FFC131' },

    // Extra
    { name: 'GitHub', icon: <SiGithub />, color: '#FFFFFF' },
    { name: 'npm', icon: <SiNpm />, color: '#CB3837' }
];

export const getTechIcon = (techName: string): TechItem | null => {
    const clean = techName.toLowerCase().trim();
    // Direct matches
    const direct = AVAILABLE_TECH.find(t => t.name.toLowerCase() === clean);
    if (direct) return direct;

    // Alias mappings
    if (clean === 'js' || clean === 'javascript') return AVAILABLE_TECH.find(t => t.name === 'JavaScript') || null;
    if (clean === 'ts' || clean === 'typescript') return AVAILABLE_TECH.find(t => t.name === 'TypeScript') || null;
    if (clean === 'tailwind') return AVAILABLE_TECH.find(t => t.name === 'Tailwind CSS') || null;
    if (clean === 'react') return AVAILABLE_TECH.find(t => t.name === 'React.js') || null;
    if (clean === 'vue') return AVAILABLE_TECH.find(t => t.name === 'Vue.js') || null;
    if (clean === 'node') return AVAILABLE_TECH.find(t => t.name === 'Node.js') || null;
    if (clean === 'express') return AVAILABLE_TECH.find(t => t.name === 'Express.js') || null;
    if (clean === 'css') return AVAILABLE_TECH.find(t => t.name === 'CSS3') || null;
    if (clean === 'html') return AVAILABLE_TECH.find(t => t.name === 'HTML5') || null;
    if (clean === 'azure') return AVAILABLE_TECH.find(t => t.name === 'Microsoft Azure') || null;
    if (clean === 'gcp') return AVAILABLE_TECH.find(t => t.name === 'Google Cloud Platform') || null;
    
    // Go/Rust Framework aliases
    if (clean === 'gin' || clean === 'fiber') {
        return { name: techName, icon: <SiGo />, color: '#00ADD8' };
    }
    if (clean === 'actix-web' || clean === 'axum') {
        return { name: techName, icon: <SiRust />, color: '#CE412B' };
    }
    if (clean === 'milvus') {
        return { name: techName, icon: <SiMilvus />, color: '#00FFB2' };
    }

    return null;
};
