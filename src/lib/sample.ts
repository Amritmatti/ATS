import type { Resume } from '../types'

export const uid = () => Math.random().toString(36).slice(2, 10)

export function emptyResume(): Resume {
  return {
    contact: { fullName: '', headline: '', email: '', phone: '', location: '', linkedin: '', website: '' },
    summary: '',
    experience: [
      {
        id: uid(),
        title: '',
        company: '',
        location: '',
        start: '',
        end: '',
        current: true,
        bullets: [{ id: uid(), text: '' }],
      },
    ],
    education: [{ id: uid(), degree: '', field: '', school: '', location: '', start: '', end: '', detail: '' }],
    skills: [
      { id: uid(), label: 'Technical Skills', items: [] },
      { id: uid(), label: 'Tools & Platforms', items: [] },
    ],
    projects: [],
    certifications: [],
    targetRole: '',
  }
}

export const SAMPLE_RESUME: Resume = {
  targetRole: 'Senior Data Engineer',
  contact: {
    fullName: 'Priya Raman',
    headline: 'Senior Data Engineer',
    email: 'priya.raman@email.com',
    phone: '+44 7700 900123',
    location: 'London, United Kingdom',
    linkedin: 'linkedin.com/in/priyaraman',
    website: 'github.com/priyaraman',
  },
  summary:
    'Senior Data Engineer with 8 years building batch and streaming platforms on AWS for fintech and retail. Owns pipelines serving 400+ analysts and 60M daily events; cut platform spend 38% and reduced SLA breaches from 14 to under 1 per quarter. Deep in Python, Spark, dbt, Airflow and Snowflake, with a track record of mentoring engineers through platform migrations.',
  experience: [
    {
      id: uid(),
      title: 'Senior Data Engineer',
      company: 'Northgate Financial',
      location: 'London, UK',
      start: 'Mar 2022',
      end: '',
      current: true,
      bullets: [
        { id: uid(), text: 'Rebuilt the core ingestion platform on Spark and Airflow, raising throughput from 8M to 60M events per day while cutting AWS spend 38% (£410K annualised).' },
        { id: uid(), text: 'Migrated 240 legacy SQL jobs to dbt with automated testing, reducing data incidents from 14 to fewer than 1 per quarter across 12 downstream teams.' },
        { id: uid(), text: 'Designed a Snowflake data model serving 400+ analysts, cutting median dashboard query time from 22s to 3s.' },
        { id: uid(), text: 'Mentored 5 engineers through the platform migration; 3 were promoted within 18 months.' },
      ],
    },
    {
      id: uid(),
      title: 'Data Engineer',
      company: 'Loomis Retail Group',
      location: 'Manchester, UK',
      start: 'Jun 2019',
      end: 'Feb 2022',
      current: false,
      bullets: [
        { id: uid(), text: 'Built a Kafka streaming pipeline feeding real-time inventory for 310 stores, replacing a nightly batch and cutting stock-out incidents 27%.' },
        { id: uid(), text: 'Automated CI/CD for the data platform with GitHub Actions and Terraform, dropping release time from 3 hours to 12 minutes.' },
        { id: uid(), text: 'Partnered with finance to deliver a forecasting dataset that improved demand accuracy 9 percentage points.' },
      ],
    },
    {
      id: uid(),
      title: 'Analytics Engineer',
      company: 'Brightpath Consulting',
      location: 'Bengaluru, India',
      start: 'Aug 2017',
      end: 'May 2019',
      current: false,
      bullets: [
        { id: uid(), text: 'Delivered 14 client reporting solutions in Python and Tableau, generating £1.2M in follow-on engagements.' },
        { id: uid(), text: 'Standardised the ETL framework used across 6 consulting teams, halving project setup time.' },
      ],
    },
  ],
  education: [
    {
      id: uid(),
      degree: 'MSc',
      field: 'Computer Science',
      school: 'University of Manchester',
      location: 'Manchester, UK',
      start: 'Sep 2016',
      end: 'Sep 2017',
      detail: 'Distinction. Dissertation on distributed stream processing.',
    },
    {
      id: uid(),
      degree: 'BEng',
      field: 'Information Technology',
      school: 'Anna University',
      location: 'Chennai, India',
      start: 'Jul 2012',
      end: 'May 2016',
      detail: '',
    },
  ],
  skills: [
    { id: uid(), label: 'Technical Skills', items: ['Python', 'SQL', 'Spark', 'Airflow', 'dbt', 'Kafka', 'ETL', 'Data Modeling', 'Data Warehousing'] },
    { id: uid(), label: 'Tools & Platforms', items: ['AWS', 'Snowflake', 'Terraform', 'Docker', 'GitHub Actions', 'Git', 'Tableau'] },
    { id: uid(), label: 'Core Competencies', items: ['Stakeholder Management', 'Mentoring', 'Cross-functional Collaboration'] },
  ],
  projects: [
    {
      id: uid(),
      name: 'OpenLineage Cost Explorer',
      role: 'Creator',
      link: 'github.com/priyaraman/cost-explorer',
      start: 'Jan 2024',
      end: 'Present',
      bullets: [
        { id: uid(), text: 'Open-source tool attributing warehouse spend to individual dbt models; 900+ GitHub stars and adopted by 40 teams.' },
      ],
    },
  ],
  certifications: [
    { id: uid(), name: 'AWS Certified Data Engineer – Associate', issuer: 'Amazon Web Services', date: 'Apr 2024', credentialId: '' },
    { id: uid(), name: 'Astronomer Certified: Apache Airflow DAG Authoring', issuer: 'Astronomer', date: 'Nov 2023', credentialId: '' },
  ],
}

export const SAMPLE_JD = `Senior Data Engineer

We are looking for a Senior Data Engineer to join our Data Platform team.

Responsibilities:
- Design, build and maintain scalable ETL and streaming data pipelines on AWS
- Own our Snowflake data warehouse and dimensional data models
- Partner with analytics and product stakeholders to deliver trusted datasets
- Improve CI/CD, testing and observability across the data platform
- Mentor mid-level engineers and raise engineering standards

Requirements:
- 5+ years of experience in data engineering with strong Python and SQL
- Strong experience with Apache Spark and Apache Airflow in production
- Experience with dbt, data modeling and data warehousing on Snowflake or BigQuery
- Hands-on experience with AWS (S3, Lambda, EKS) and infrastructure as code using Terraform
- Experience building streaming pipelines with Kafka
- Familiarity with Docker, Kubernetes and CI/CD pipelines
- Excellent communication and stakeholder management skills

Nice to have:
- Experience with machine learning feature pipelines
- Exposure to data governance and compliance (GDPR)
`
