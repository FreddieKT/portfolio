import type { ImageMetadata } from 'astro';
import terrariumImage from '../assets/images/projects/terrarium-hero.png';
import terrariumFront from '../assets/images/projects/terrarium-front.png';
import xlabLanding from '../assets/images/projects/xlab-landing.webp';
import xlabControl from '../assets/images/projects/xlab-control.webp';

export interface Project {
  index: string;
  slug: string;
  title: string;
  label: string;
  category: string;
  summary: string;
  problem?: string;
  does?: string;
  stack: string[];
  status: string;
  nextStep?: string;
  sourceUrl?: string;
  image?: ImageMetadata;
  imageAlt?: string;
  secondaryImage?: ImageMetadata;
  secondaryImageAlt?: string;
  secondaryImageCaption?: string;
}

export const projects: Project[] = [
  {
    index: '01',
    slug: 'xlab-agent-platform',
    title: 'X-LAB AGENT PLATFORM',
    label: 'agent control plane',
    category: 'AI PLATFORM',
    summary: 'A platform I’m building to set up and manage AI agents for different businesses.',
    problem: 'Agent products need clear boundaries around identity, permissions, customer data, human review, and the code they are allowed to run.',
    does: 'Registers agent blueprints in code, creates organization-specific deployments, routes jobs to approved handlers, and records owner actions for review.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Tailwind CSS', 'Hermes Runtime', 'SQLite', 'PostgreSQL'],
    status: 'active development',
    nextStep: 'Run the synthetic OrderBot Retail showcase before any real customer onboarding.',
    sourceUrl: 'https://github.com/FreddieKT/xlab-agent-platform',
    image: xlabLanding,
    imageAlt: 'X-Lab public landing page with the headline "Identity-rich agents, deployed with review."',
    secondaryImage: xlabControl,
    secondaryImageAlt: 'X-Lab agent control center showing the agent catalog, deployments table and setup checklist, rendered locally with demo data.',
    secondaryImageCaption: 'Demo data: rendered locally with a mocked API. Customers, counts and dates are made up.',
  },

  {
    index: '02',
    slug: 'iot-terrarium',
    title: 'IOT TERRARIUM',
    label: '3D concept · not a hardware build',
    category: 'BLENDER EXPERIMENT',
    summary: 'A Blender concept exploring how plants, lighting, watering and sensors could fit together in a compact terrarium.',
    stack: ['Blender', 'Python'],
    status: '3D concept · not a hardware build',
    image: terrariumImage,
    imageAlt: 'Three-quarter Blender render of a glass terrarium with plants, an external water reservoir and a controller concept.',
    secondaryImage: terrariumFront,
    secondaryImageAlt: 'Front view of the terrarium concept showing the plants, external water reservoir and controller.',
  },
  {
    index: '03',
    slug: 'project-rules',
    title: 'PROJECT RULES',
    label: 'workspace and Git safety',
    category: 'DEVELOPER WORKFLOW',
    summary: 'A shared set of rules for creating, organizing, and changing projects on my Mac and GitHub.',
    problem: 'Projects become hard to manage when folders, Git actions, approvals, and agent instructions follow different rules.',
    does: 'Defines approved workspace locations, project setup checks, branch rules, external action approvals, and reusable templates for coding agents.',
    stack: ['Markdown', 'Python', 'Git'],
    status: 'in use and still being refined',
    nextStep: 'Keep the rules short enough to follow and update the checks when the workspace changes.',
    sourceUrl: 'https://github.com/FreddieKT/project-rules',
  },

];
