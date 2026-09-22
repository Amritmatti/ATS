import type { Resume } from '../types'
import { SAMPLE_JD, SAMPLE_RESUME, uid } from './sample'

export interface Template {
  id: string
  name: string
  blurb: string
  resume: Resume
  jd: string
}

/**
 * Senior DevOps / Cloud / Site Reliability Engineer.
 *
 * Contact details and education are real. Everything below them — summary, roles,
 * companies, metrics and the project — is still illustrative demo content kept to show
 * what scores well: every bullet opens with an achievement verb, most carry a metric with
 * a before/after, and the skills are grouped the way recruiters search.
 *
 * REPLACE THE SUMMARY, EXPERIENCE AND PROJECT before sending this to anyone.
 */
const SRE: Template = {
  id: 'sre',
  name: 'Senior DevOps / Cloud / SRE',
  blurb: 'Platform, reliability and cloud infrastructure roles.',
  resume: {
    targetRole: 'Senior Site Reliability Engineer',
    contact: {
      fullName: 'Amrit Pal Singh',
      headline: 'Senior DevOps / Site Reliability Engineer',
      email: 'amritmatti007@gmail.com',
      phone: '+(91)94176-23163',
      location: 'Mohali, Punjab',
      linkedin: 'linkedin.com/in/amritpalsingh040497',
      website: 'github.com/amritmatti',
    },
    summary:
      'Senior DevOps and Site Reliability Engineer with 9 years running production platforms on AWS and Kubernetes for fintech and logistics. Owns infrastructure serving 140 services and 4M daily users; cut P1 incidents 62% and cloud spend 31% while raising deployment frequency from weekly to 40 times a day. Deep in Terraform, Kubernetes, Go and observability, with a track record of leading incident response and mentoring platform teams.',
    experience: [
      {
        id: uid(),
        title: 'Senior Site Reliability Engineer',
        company: 'Helio Payments',
        location: 'London, UK',
        start: 'Mar 2022',
        end: '',
        current: true,
        bullets: [
          { id: uid(), text: 'Introduced SLO-based alerting and error budgets across 140 services, cutting P1 incidents from 38 to 14 per quarter and alert noise 71%.' },
          { id: uid(), text: 'Migrated 210 workloads from EC2 to EKS using Terraform and Argo CD, reducing deploy lead time from 4 days to 35 minutes.' },
          { id: uid(), text: 'Drove a FinOps programme across 6 teams that cut AWS spend 31% ($1.4M annually) through rightsizing, Karpenter autoscaling and savings plans.' },
          { id: uid(), text: 'Led incident command for a 60-engineer org, lifting blameless postmortem completion from 45% to 98% within two quarters.' },
          { id: uid(), text: 'Rebuilt the multi-region disaster recovery posture to a 15-minute RTO, proven by quarterly failover game days.' },
          { id: uid(), text: 'Implemented end-to-end MLOps practices covering model training, deployment, versioning, monitoring and drift detection for 18 production models, cutting retraining turnaround from 3 weeks to 2 days.' },
          { id: uid(), text: 'Built ML workflows on AWS SageMaker for training and inference, reducing model deployment lead time from 5 days to 4 hours.' },
          { id: uid(), text: 'Automated orchestration with Airflow, AWS Step Functions and Kubeflow, replacing 40+ manual handoffs and cutting pipeline failures 64%.' },
        ],
      },
      {
        id: uid(),
        title: 'DevOps Engineer',
        company: 'Northwind Logistics',
        location: 'Manchester, UK',
        start: 'Jun 2019',
        end: 'Feb 2022',
        current: false,
        bullets: [
          { id: uid(), text: 'Built GitOps pipelines in GitLab CI and Helm for 85 microservices, raising deployment frequency from weekly to 40 releases per day.' },
          { id: uid(), text: 'Authored reusable Terraform modules adopted by 9 teams, cutting environment provisioning from 3 weeks to 2 hours.' },
          { id: uid(), text: 'Instrumented Prometheus, Grafana and OpenTelemetry tracing, reducing mean time to detect from 22 minutes to 4.' },
          { id: uid(), text: 'Automated secrets rotation with HashiCorp Vault across 300 workloads, eliminating 100% of long-lived static credentials.' },
        ],
      },
      {
        id: uid(),
        title: 'Cloud Systems Engineer',
        company: 'Brightpath Managed Services',
        location: 'Bengaluru, India',
        start: 'Aug 2016',
        end: 'May 2019',
        current: false,
        bullets: [
          { id: uid(), text: 'Administered 400+ Linux hosts and hardened CIS baselines with Ansible, closing 92% of audit findings before SOC 2 renewal.' },
          { id: uid(), text: 'Replaced manual patching with scheduled automation, recovering roughly 30 engineer-hours per month across 5 client estates.' },
        ],
      },
    ],
    education: [
      {
        id: uid(),
        degree: 'B.Tech',
        field: 'Computer Science and Engineering',
        school: 'Chandigarh Engineering College',
        location: '',
        start: 'Aug 2014',
        end: 'May 2017',
        detail: '',
      },
    ],
    skills: [
      { id: uid(), label: 'Cloud & Infrastructure', items: ['AWS', 'Azure', 'GCP', 'Terraform', 'CloudFormation', 'Ansible', 'Packer', 'Linux', 'Networking'] },
      { id: uid(), label: 'Containers & Orchestration', items: ['Kubernetes', 'Docker', 'Helm', 'Argo CD', 'GitOps', 'Service Mesh', 'Autoscaling'] },
      { id: uid(), label: 'CI/CD & Automation', items: ['CI/CD', 'GitLab', 'GitHub Actions', 'Jenkins', 'Python', 'Bash', 'Go', 'Git', 'Progressive Delivery', 'Platform Engineering'] },
      { id: uid(), label: 'Reliability & Observability', items: ['Site Reliability', 'Prometheus', 'Grafana', 'OpenTelemetry', 'Datadog', 'SLOs & Error Budgets', 'Incident Response', 'Postmortems', 'Chaos Engineering', 'Disaster Recovery', 'Capacity Planning'] },
      { id: uid(), label: 'MLOps & ML Platform', items: ['MLOps', 'AWS SageMaker', 'Kubeflow', 'Step Functions', 'Airflow', 'Model Training', 'Model Deployment', 'Model Versioning', 'Model Monitoring', 'Machine Learning'] },
      { id: uid(), label: 'Security & Governance', items: ['IAM', 'HashiCorp Vault', 'Zero Trust', 'Compliance', 'Risk Management', 'FinOps'] },
      { id: uid(), label: 'Core Competencies', items: ['Communication', 'Stakeholder Management', 'Mentoring', 'Cross-functional Collaboration'] },
    ],
    projects: [
      {
        id: uid(),
        name: 'kube-budget',
        role: 'Creator',
        link: 'github.com/arjunmehta/kube-budget',
        start: 'Feb 2024',
        end: 'Present',
        bullets: [
          { id: uid(), text: 'Created an open-source controller attributing Kubernetes cluster cost to namespaces and owners; 1,200+ GitHub stars, used by 35 teams.' },
        ],
      },
    ],
    certifications: [
      { id: uid(), name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: 'Mar 2024', credentialId: '' },
      { id: uid(), name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', date: 'Sep 2023', credentialId: '' },
      { id: uid(), name: 'HashiCorp Certified: Terraform Associate', issuer: 'HashiCorp', date: 'Jan 2023', credentialId: '' },
    ],
  },
  jd: `Senior Site Reliability Engineer

We are hiring a Senior Site Reliability Engineer to join our Platform Engineering group and
own the reliability of a payments platform serving millions of users.

Responsibilities:
- Own service level objectives, error budgets and alerting for business-critical services
- Design, build and operate infrastructure on AWS using Terraform and infrastructure as code
- Run and scale production Kubernetes clusters, including Helm and GitOps deployment workflows
- Improve CI/CD pipelines, progressive delivery and release safety
- Lead incident response as incident commander and drive blameless postmortems
- Build observability with Prometheus, Grafana and OpenTelemetry
- Partner with engineering teams on capacity planning and cloud cost optimization
- Mentor engineers and raise reliability standards across the organisation

Requirements:
- 5+ years of experience in SRE, DevOps or platform engineering roles
- Strong hands-on experience with AWS and infrastructure as code using Terraform
- Strong production experience with Kubernetes, Docker and Helm
- Proficiency in at least one of Python, Go or Bash
- Experience with CI/CD pipelines (GitLab CI, GitHub Actions or Jenkins)
- Experience defining SLIs and SLOs and running an on-call rotation
- Solid Linux and networking fundamentals
- Excellent communication and stakeholder management skills

Nice to have:
- Experience with Argo CD, service mesh (Istio) or chaos engineering
- Exposure to HashiCorp Vault, IAM and compliance frameworks such as SOC 2
- Experience with disaster recovery planning and multi-region failover
- CKA, AWS or Terraform certification
`,
}

const DATA_ENGINEER: Template = {
  id: 'data-engineer',
  name: 'Senior Data Engineer',
  blurb: 'Data platform, pipeline and analytics engineering roles.',
  resume: SAMPLE_RESUME,
  jd: SAMPLE_JD,
}

export const TEMPLATES: Template[] = [SRE, DATA_ENGINEER]

export const DEFAULT_TEMPLATE = SRE
