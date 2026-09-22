/** Knowledge base used by the keyword extractor and the scoring engine. */

const STOPWORD_SOURCE = `a about above after again against all am an and any are aren't as at be because been
before being below between both but by can cannot could couldn't did didn't do does doesn't doing don't down during each few for from
further had hadn't has hasn't have haven't having he her here hers herself him himself his how i if in into is isn't it it's its
itself just let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same
shan't she should shouldn't so some such than that the their theirs them themselves then there these they this those through to too
under until up very was wasn't we were weren't what when where which while who whom why with won't would wouldn't you your yours
yourself yourselves will shall may might must also across among within without upon per via etc ability able role roles job jobs work
working works team teams company companies candidate candidates ideal strong good great excellent required requirement requirements
responsibility responsibilities preferred plus nice position opportunity looking join help ensure ensuring provide providing
support supporting new use used using year years month months day days time times well like others best high low including include
includes benefits salary equal employer diverse diversity applicants apply application
experience experiences experienced skill skills knowledge understanding familiarity exposure proficiency expertise
hands-on senior junior mid-level lead degree equivalent related field background track record solid demonstrated
proven deep excellent strong ideally essential desirable etc successful successfully`

export const STOPWORDS = new Set<string>(STOPWORD_SOURCE.split(/\s+/).filter(Boolean))

/** Canonical skill / tool vocabulary. key = canonical label, values = aliases (lowercase). */
export const SKILL_TAXONOMY: Record<string, string[]> = {
  // Languages
  JavaScript: ['javascript', 'js', 'es6', 'ecmascript'],
  TypeScript: ['typescript'],
  Python: ['python', 'python3'],
  Java: ['java'],
  'C#': ['c#', 'csharp', '.net', 'dotnet'],
  'C++': ['c++', 'cpp'],
  Go: ['golang', 'go lang'],
  Rust: ['rust'],
  Ruby: ['ruby', 'ruby on rails', 'rails'],
  PHP: ['php', 'laravel'],
  Swift: ['swift'],
  Kotlin: ['kotlin'],
  Scala: ['scala'],
  SQL: ['sql', 't-sql', 'pl/sql'],
  Bash: ['bash', 'shell scripting', 'shell script'],
  PowerShell: ['powershell'],
  MATLAB: ['matlab'],

  // Frontend
  React: ['react', 'react.js', 'reactjs'],
  'Next.js': ['next.js', 'nextjs'],
  Angular: ['angular', 'angularjs'],
  'Vue.js': ['vue', 'vue.js', 'vuejs'],
  Svelte: ['svelte', 'sveltekit'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3', 'sass', 'scss', 'tailwind', 'tailwindcss'],
  Redux: ['redux'],
  'React Native': ['react native'],
  'Build Tooling': ['webpack', 'vite', 'rollup', 'babel'],

  // Backend
  'Node.js': ['node', 'node.js', 'nodejs'],
  Express: ['express', 'express.js'],
  Django: ['django'],
  Flask: ['flask'],
  FastAPI: ['fastapi'],
  Spring: ['spring', 'spring boot', 'springboot'],
  GraphQL: ['graphql', 'apollo'],
  'REST APIs': ['rest', 'rest api', 'restful', 'restful api', 'rest apis'],
  gRPC: ['grpc'],
  Microservices: ['microservices', 'microservice architecture'],

  // Data
  PostgreSQL: ['postgres', 'postgresql'],
  MySQL: ['mysql', 'mariadb'],
  MongoDB: ['mongodb', 'mongo'],
  Redis: ['redis'],
  Elasticsearch: ['elasticsearch', 'elastic search', 'opensearch'],
  Cassandra: ['cassandra'],
  DynamoDB: ['dynamodb'],
  Snowflake: ['snowflake'],
  BigQuery: ['bigquery', 'big query'],
  Redshift: ['redshift'],
  Databricks: ['databricks'],
  Spark: ['spark', 'pyspark', 'apache spark'],
  Hadoop: ['hadoop', 'hdfs'],
  Kafka: ['kafka', 'apache kafka'],
  Airflow: ['airflow', 'apache airflow'],
  dbt: ['dbt'],
  ETL: ['etl', 'elt', 'data pipeline', 'data pipelines'],
  'Data Warehousing': ['data warehouse', 'data warehousing'],
  'Data Modeling': ['data modeling', 'data modelling', 'dimensional modeling'],
  Tableau: ['tableau'],
  'Power BI': ['power bi', 'powerbi'],
  Looker: ['looker', 'looker studio'],
  Excel: ['excel', 'advanced excel', 'microsoft excel'],
  Pandas: ['pandas', 'numpy'],

  // ML / AI
  'Machine Learning': ['machine learning'],
  'Deep Learning': ['deep learning', 'neural networks'],
  NLP: ['nlp', 'natural language processing'],
  TensorFlow: ['tensorflow', 'keras'],
  PyTorch: ['pytorch'],
  'scikit-learn': ['scikit-learn', 'sklearn', 'scikit learn'],
  'LLMs': ['llm', 'llms', 'large language model', 'large language models', 'genai', 'generative ai'],
  MLOps: ['mlops'],
  'A/B Testing': ['a/b testing', 'ab testing', 'split testing', 'experimentation'],
  Statistics: ['statistics', 'statistical analysis', 'statistical modeling'],

  // Cloud / Infra
  AWS: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'eks'],
  Azure: ['azure', 'microsoft azure', 'aks'],
  GCP: ['gcp', 'google cloud', 'google cloud platform', 'gke'],
  Kubernetes: ['kubernetes', 'k8s'],
  Docker: ['docker', 'containerization', 'containers'],
  Terraform: ['terraform', 'infrastructure as code'],
  Ansible: ['ansible'],
  Jenkins: ['jenkins'],
  'CI/CD': ['ci/cd', 'cicd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  'GitHub Actions': ['github actions'],
  GitLab: ['gitlab', 'gitlab ci'],
  Git: ['git', 'version control'],
  Linux: ['linux', 'unix', 'ubuntu', 'rhel', 'centos'],
  Networking: ['networking', 'tcp/ip', 'dns', 'load balancing', 'vpc'],
  Observability: ['observability', 'monitoring', 'prometheus', 'grafana', 'datadog', 'splunk', 'new relic'],
  'Site Reliability': ['sre', 'site reliability', 'reliability engineering'],
  Serverless: ['serverless'],

  // Security
  Cybersecurity: ['cybersecurity', 'cyber security', 'information security', 'infosec'],
  'Penetration Testing': ['penetration testing', 'pen testing', 'pentest'],
  IAM: ['iam', 'identity and access management', 'rbac', 'sso', 'oauth', 'saml'],
  Compliance: ['compliance', 'soc 2', 'soc2', 'iso 27001', 'gdpr', 'hipaa', 'pci dss'],
  'Risk Management': ['threat modeling', 'risk assessment', 'vulnerability management', 'risk management'],
  Encryption: ['encryption', 'cryptography', 'tls', 'pki'],

  // Product / Delivery / Business
  'Product Management': ['product management', 'product manager', 'product owner'],
  Roadmapping: ['roadmap', 'roadmapping', 'product roadmap'],
  Agile: ['agile', 'scrum', 'kanban', 'sprint planning'],
  Jira: ['jira', 'confluence'],
  'Stakeholder Management': ['stakeholder management', 'stakeholder engagement', 'stakeholders'],
  'Requirements Gathering': ['requirements gathering', 'user stories', 'prd'],
  'Business Analysis': ['business analysis', 'business analyst', 'gap analysis'],
  'Process Improvement': ['process improvement', 'lean', 'six sigma', 'continuous improvement'],
  'Project Management': ['project management', 'pmp', 'program management', 'programme management'],
  'Budget Management': ['budget management', 'budgeting', 'cost control'],
  'Vendor Management': ['vendor management', 'procurement', 'supplier management'],
  'Change Management': ['change management'],
  'Go-to-Market': ['go-to-market', 'gtm', 'product launch'],
  'Market Research': ['market research', 'competitive analysis', 'user research'],
  Forecasting: ['forecasting', 'demand planning'],

  // Marketing / Sales
  SEO: ['seo', 'search engine optimization'],
  SEM: ['sem', 'ppc', 'google ads', 'paid search'],
  'Content Marketing': ['content marketing', 'content strategy', 'copywriting'],
  'Email Marketing': ['email marketing', 'marketing automation', 'hubspot', 'marketo'],
  'Social Media': ['social media', 'social media marketing'],
  'Google Analytics': ['google analytics', 'ga4'],
  Salesforce: ['salesforce', 'crm'],
  'Lead Generation': ['lead generation', 'prospecting', 'pipeline generation'],
  'Account Management': ['account management', 'client relationship', 'customer success'],
  Negotiation: ['negotiation', 'contract negotiation'],

  // Finance / HR / Ops
  'Financial Modeling': ['financial modeling', 'financial modelling', 'valuation', 'dcf'],
  Accounting: ['accounting', 'gaap', 'ifrs', 'bookkeeping', 'reconciliation'],
  'Financial Reporting': ['financial reporting', 'month-end close', 'variance analysis'],
  Auditing: ['auditing', 'internal audit', 'external audit'],
  Payroll: ['payroll'],
  Recruiting: ['recruiting', 'recruitment', 'talent acquisition', 'sourcing'],
  Onboarding: ['onboarding', 'employee onboarding'],
  'Performance Management': ['performance management', 'performance reviews'],
  'Supply Chain': ['supply chain', 'logistics', 'inventory management'],
  'Quality Assurance': ['quality assurance', 'quality control'],

  // Soft skills
  Leadership: ['leadership', 'team leadership', 'people management', 'mentoring', 'coaching'],
  Communication: ['communication', 'presentation skills'],
  Collaboration: ['collaboration', 'cross-functional', 'cross functional', 'teamwork'],
  'Problem Solving': ['problem solving', 'problem-solving', 'analytical thinking', 'critical thinking'],
  'Time Management': ['time management', 'prioritization', 'organizational skills'],
  Adaptability: ['adaptability', 'flexibility'],
  'Attention to Detail': ['attention to detail', 'detail-oriented', 'detail oriented'],
}

export const SOFT_SKILLS = new Set([
  'Leadership',
  'Communication',
  'Collaboration',
  'Problem Solving',
  'Time Management',
  'Adaptability',
  'Attention to Detail',
  'Negotiation',
  'Stakeholder Management',
])

export const TOOL_SKILLS = new Set([
  'Jira', 'Tableau', 'Power BI', 'Looker', 'Excel', 'Salesforce', 'Docker',
  'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab',
  'Git', 'Build Tooling', 'Databricks', 'Snowflake', 'Google Analytics',
])

export const CERT_PATTERNS = [
  'pmp', 'cissp', 'cisa', 'cism', 'ceh', 'comptia', 'security+', 'network+',
  'aws certified', 'azure certified', 'google cloud certified', 'cka', 'ckad',
  'terraform associate', 'scrum master', 'csm', 'psm', 'itil', 'cpa',
  'cfa', 'six sigma', 'prince2', 'shrm', 'phr',
]

/** Strong resume action verbs, grouped so we can suggest alternatives in context. */
export const ACTION_VERBS: Record<string, string[]> = {
  leadership: ['Led', 'Directed', 'Spearheaded', 'Orchestrated', 'Mentored', 'Supervised', 'Coordinated', 'Oversaw', 'Championed'],
  achievement: ['Delivered', 'Achieved', 'Exceeded', 'Surpassed', 'Attained', 'Secured', 'Won', 'Completed'],
  improvement: ['Improved', 'Optimised', 'Optimized', 'Streamlined', 'Accelerated', 'Reduced', 'Increased', 'Boosted', 'Enhanced', 'Modernised', 'Modernized', 'Refactored', 'Cut', 'Grew'],
  creation: ['Built', 'Designed', 'Developed', 'Engineered', 'Architected', 'Created', 'Launched', 'Implemented', 'Established', 'Introduced', 'Prototyped'],
  analysis: ['Analysed', 'Analyzed', 'Evaluated', 'Assessed', 'Investigated', 'Diagnosed', 'Forecasted', 'Modelled', 'Modeled', 'Audited', 'Researched'],
  operations: ['Automated', 'Migrated', 'Deployed', 'Scaled', 'Maintained', 'Integrated', 'Configured', 'Administered', 'Standardised', 'Standardized', 'Resolved', 'Remediated', 'Owned', 'Drove', 'Managed'],
  communication: ['Presented', 'Negotiated', 'Advised', 'Influenced', 'Partnered', 'Facilitated', 'Trained', 'Authored', 'Documented'],
}

export const ALL_ACTION_VERBS = new Set(
  Object.values(ACTION_VERBS).flat().map((v) => v.toLowerCase()),
)

/** Openers that make a bullet read as a job duty rather than an achievement. */
export const WEAK_OPENERS = [
  'responsible for',
  'duties included',
  'tasked with',
  'helped',
  'assisted',
  'worked on',
  'worked with',
  'participated in',
  'involved in',
  'in charge of',
  'handled',
  'dealt with',
  'was part of',
  'contributed to',
]

export const BUZZWORDS = [
  'team player', 'hard worker', 'hard-working', 'go-getter', 'self-starter',
  'think outside the box', 'results-driven', 'detail-oriented', 'synergy',
  'guru', 'ninja', 'rockstar', 'wheelhouse', 'best of breed',
  'value add', 'go the extra mile', 'passionate about', 'proven track record',
]

export const FIRST_PERSON = ['i', 'me', 'my', 'mine', 'myself', 'we', 'our', 'ours', 'us']

/** Section headings that ATS parsers reliably recognise. */
export const SAFE_HEADINGS = [
  'Professional Summary',
  'Work Experience',
  'Education',
  'Skills',
  'Projects',
  'Certifications',
]

/** Verb suggestions keyed by a weak opener. */
export const OPENER_REPLACEMENTS: Record<string, string[]> = {
  'responsible for': ['Owned', 'Led', 'Directed', 'Managed'],
  'duties included': ['Delivered', 'Executed', 'Ran'],
  'tasked with': ['Owned', 'Drove', 'Delivered'],
  helped: ['Enabled', 'Accelerated', 'Partnered with'],
  assisted: ['Supported', 'Enabled', 'Partnered with'],
  'worked on': ['Built', 'Developed', 'Delivered'],
  'worked with': ['Partnered with', 'Collaborated with', 'Advised'],
  'participated in': ['Contributed to', 'Drove', 'Co-led'],
  'involved in': ['Drove', 'Led', 'Delivered'],
  'in charge of': ['Owned', 'Directed', 'Led'],
  handled: ['Managed', 'Resolved', 'Processed'],
  'dealt with': ['Resolved', 'Managed', 'Remediated'],
  'was part of': ['Contributed to', 'Co-led'],
  'contributed to': ['Drove', 'Delivered', 'Built'],
}
