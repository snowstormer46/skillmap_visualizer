/**
 * Rule-based resume analyser — no API key required.
 * Uses keyword matching against comprehensive per-role skill dictionaries.
 */

export interface AnalysisResult {
  matchScore: number;
  missingSkills: string[];
  recommendedProjects: {
    title: string;
    description: string;
    techStack: string[];
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    skills_practiced?: string[];
  }[];
}

export interface RoleSuggestion {
  role: string;
  matchScore: number;
  reason: string;
}

// ─── Skill Dictionary (keywords per role) ────────────────────────────────────
export const ROLE_SKILLS: Record<string, string[]> = {
  'Backend Developer': [
    'node', 'nodejs', 'express', 'fastify', 'nestjs', 'go', 'golang', 'python', 'django', 'flask', 'fastapi',
    'java', 'spring', 'spring boot', 'kotlin', 'rust', 'c#', '.net', 'asp.net', 'php', 'laravel', 'ruby', 'ruby on rails',
    'sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'sql server',
    'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'couchdb', 'neo4j', 'prisma', 'typeorm', 'mongoose',
    'rest', 'api', 'graphql', 'grpc', 'websocket', 'socket.io', 'apollo',
    'jwt', 'oauth', 'oauth2', 'authentication', 'authorization', 'security', 'passportjs', 'bcrypt',
    'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'cloud', 'ecs', 'fargate', 'lambda',
    'microservices', 'message queue', 'rabbitmq', 'kafka', 'celery', 'sqs', 'sns', 'pubsub',
    'ci/cd', 'git', 'linux', 'bash', 'shell', 'nginx', 'apache', 'pm2',
    'caching', 'performance', 'scalability', 'testing', 'unit test', 'jest', 'mocha', 'chai', 'pytest', 'junit'
  ],
  'Frontend Developer': [
    'html', 'html5', 'css', 'css3', 'javascript', 'js', 'typescript', 'ts', 'es6',
    'react', 'react.js', 'reactjs', 'vue', 'vue.js', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby',
    'redux', 'redux toolkit', 'zustand', 'mobx', 'recoil', 'context api', 'state management', 'vuex', 'pinia',
    'tailwind', 'tailwindcss', 'sass', 'scss', 'less', 'styled-components', 'material ui', 'mui', 'shadcn', 'chakra', 'bootstrap',
    'webpack', 'vite', 'babel', 'eslint', 'prettier', 'rollup', 'parcel',
    'jest', 'cypress', 'playwright', 'testing library', 'vitest', 'mocha', 'selenium',
    'figma', 'responsive', 'accessibility', 'wcag', 'seo', 'ui/ux',
    'rest', 'api', 'graphql', 'fetch', 'axios', 'apollo', 'react query', 'swr',
    'git', 'npm', 'yarn', 'pnpm', 'performance', 'lighthouse',
    'pwa', 'service worker', 'web vitals', 'animation', 'framer', 'framer motion', 'gsap', 'three.js'
  ],
  'Fullstack Engineer': [
    'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular', 'next.js', 'svelte',
    'node', 'nodejs', 'express', 'nestjs', 'python', 'django', 'fastapi', 'go', 'java', 'spring', 'ruby', 'php',
    'sql', 'postgresql', 'mongodb', 'mysql', 'redis', 'prisma', 'typeorm', 'mongoose',
    'rest', 'api', 'graphql', 'authentication', 'jwt', 'oauth',
    'docker', 'kubernetes', 'aws', 'gcp', 'vercel', 'heroku', 'render', 'netlify',
    'git', 'ci/cd', 'github actions', 'testing', 'jest', 'cypress', 'deployment',
    'microservices', 'websocket', 'socket.io', 'security', 'performance', 'tailwind', 'sass'
  ],
  'DevOps Engineer': [
    'linux', 'ubuntu', 'centos', 'bash', 'shell', 'scripting', 'python', 'go', 'ruby',
    'docker', 'dockerfile', 'compose', 'containerization', 'podman',
    'kubernetes', 'k8s', 'helm', 'argo', 'argocd', 'gitops', 'istio',
    'terraform', 'ansible', 'chef', 'puppet', 'infrastructure', 'iac', 'pulumi',
    'aws', 'gcp', 'azure', 'cloud', 'ec2', 's3', 'lambda', 'vpc', 'iam', 'eks', 'aks', 'gke',
    'ci/cd', 'jenkins', 'github actions', 'gitlab', 'gitlab ci', 'circleci', 'travis', 'bamboo',
    'monitoring', 'prometheus', 'grafana', 'elk', 'splunk', 'datadog', 'new relic', 'fluentd', 'kibana',
    'nginx', 'haproxy', 'load balancing', 'networking', 'dns', 'tcp/ip',
    'security', 'ssl', 'tls', 'vault', 'git', 'site reliability', 'sre'
  ],
  'Data Scientist': [
    'python', 'r', 'julia', 'sql', 'c++', 'scala',
    'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly', 'bokeh',
    'scikit-learn', 'sklearn', 'xgboost', 'lightgbm', 'catboost', 'statsmodels',
    'tensorflow', 'keras', 'pytorch', 'huggingface', 'transformers', 'spacy', 'nltk',
    'machine learning', 'deep learning', 'neural network', 'nlp', 'computer vision', 'opencv',
    'statistics', 'probability', 'hypothesis', 'regression', 'classification', 'clustering', 'a/b testing',
    'jupyter', 'notebook', 'colab', 'mlflow', 'dvc', 'weights and biases', 'wandb',
    'spark', 'pyspark', 'hadoop', 'airflow', 'kafka', 'data pipeline', 'etl',
    'sql', 'postgresql', 'mongodb', 'bigquery', 'snowflake', 'redshift', 'athena',
    'tableau', 'power bi', 'looker', 'visualization', 'dash', 'streamlit'
  ],
  'Mobile Developer': [
    'swift', 'objective-c', 'ios', 'xcode', 'cocoapods', 'swiftui', 'uikit',
    'kotlin', 'java', 'android', 'android studio', 'gradle', 'jetpack compose',
    'react native', 'flutter', 'dart', 'ionic', 'cordova', 'xamarin', 'maui',
    'mobile', 'responsive', 'ui/ux', 'app store', 'google play', 'testflight',
    'sqlite', 'realm', 'core data', 'room',
    'firebase', 'firestore', 'push notifications', 'apns', 'fcm',
    'rest', 'api', 'graphql', 'graphql', 'apollo',
    'git', 'ci/cd', 'fastlane', 'bitrise', 'testing', 'jest', 'detox', 'appium', 'espresso', 'xctest'
  ],
  'Artificial Intelligence / Machine Learning Engineer': [
    'python', 'c++', 'r', 'java', 'julia',
    'tensorflow', 'keras', 'pytorch', 'scikit-learn', 'jax', 'mxnet',
    'machine learning', 'deep learning', 'neural network', 'nlp', 'computer vision', 'opencv',
    'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn',
    'sql', 'nosql', 'hadoop', 'spark', 'kafka',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'sagemaker',
    'mlops', 'mlflow', 'kubeflow', 'dvc',
    'git', 'ci/cd', 'linux', 'bash'
  ],
  'Cybersecurity Engineer': [
    'linux', 'kali', 'bash', 'powershell', 'python', 'c', 'c++', 'go',
    'networking', 'tcp/ip', 'dns', 'firewalls', 'vpn', 'ids', 'ips',
    'security', 'penetration testing', 'vulnerability assessment', 'ethical hacking',
    'wireshark', 'metasploit', 'nmap', 'burp suite', 'nessus',
    'siem', 'splunk', 'qradar', 'elk', 'log analysis',
    'cryptography', 'pki', 'ssl', 'tls',
    'iam', 'active directory', 'oauth', 'saml',
    'cloud security', 'aws', 'azure', 'gcp', 'docker security', 'k8s security',
    'incident response', 'forensics', 'malware analysis'
  ],
  'Cloud Engineer': [
    'linux', 'bash', 'powershell', 'python', 'go',
    'aws', 'gcp', 'azure', 'cloud architecture', 'serverless', 'lambda',
    'terraform', 'cloudformation', 'ansible', 'chef', 'puppet', 'iac',
    'docker', 'kubernetes', 'ecs', 'eks', 'fargate',
    'ci/cd', 'jenkins', 'gitlab ci', 'github actions',
    'networking', 'vpc', 'dns', 'load balancing', 'cdn',
    'monitoring', 'prometheus', 'grafana', 'datadog', 'cloudwatch',
    'security', 'iam', 'kms', 'compliance',
    'sql', 'nosql', 'storage', 's3'
  ],
  'Product Manager': [
    'agile', 'scrum', 'kanban', 'sprint planning', 'jira', 'confluence', 'trello',
    'product strategy', 'roadmap', 'vision', 'kpi', 'okr',
    'user research', 'user interviews', 'a/b testing', 'usability testing',
    'data analysis', 'sql', 'excel', 'google analytics', 'mixpanel', 'amplitude', 'tableau',
    'wireframing', 'prototyping', 'figma', 'balsamiq', 'sketch',
    'stakeholder management', 'communication', 'leadership', 'prioritization',
    'market research', 'competitive analysis', 'go-to-market'
  ],
  'UI/UX Designer': [
    'figma', 'sketch', 'adobe xd', 'invision', 'marvel',
    'wireframing', 'prototyping', 'mockups', 'user flows', 'information architecture',
    'user research', 'user personas', 'journey mapping', 'usability testing',
    'visual design', 'typography', 'color theory', 'layout', 'iconography',
    'interaction design', 'microinteractions', 'animation', 'principle', 'framer',
    'html', 'css', 'javascript', 'responsive design', 'material design', 'apple hig',
    'accessibility', 'wcag', 'empathy', 'collaboration'
  ],
  'Robotics Engineer': [
    'c++', 'python', 'c', 'matlab',
    'ros', 'ros2', 'robot operating system', 'gazebo', 'rviz',
    'kinematics', 'dynamics', 'control theory', 'pid', 'mpc',
    'computer vision', 'opencv', 'pcl', 'point cloud', 'slam',
    'machine learning', 'deep learning', 'reinforcement learning',
    'electronics', 'microcontrollers', 'arduino', 'raspberry pi', 'sensors', 'actuators',
    'linux', 'embedded systems', 'rtos',
    'git', 'ci/cd', 'simulation'
  ],
  'Blockchain Developer': [
    'solidity', 'rust', 'go', 'vyper', 'javascript', 'typescript', 'c++',
    'ethereum', 'bitcoin', 'solana', 'polkadot', 'binance smart chain', 'polygon',
    'smart contracts', 'erc20', 'erc721', 'nfts', 'defi', 'dex',
    'web3.js', 'ethers.js', 'truffle', 'hardhat', 'brownie', 'foundry',
    'cryptography', 'hash functions', 'pki', 'consensus algorithms', 'pow', 'pos',
    'ipfs', 'decentralized storage', 'oracles', 'chainlink',
    'git', 'testing', 'security auditing'
  ],
  'AI Prompt Engineer': [
    'python', 'javascript',
    'prompt engineering', 'zero-shot', 'few-shot', 'chain-of-thought', 'tree-of-thought',
    'llm', 'chatgpt', 'gpt-3', 'gpt-4', 'claude', 'gemini', 'llama', 'midjourney', 'stable diffusion',
    'langchain', 'llamaindex', 'vector databases', 'pinecone', 'weaviate', 'milvus', 'chromadb',
    'nlp', 'text generation', 'creative writing', 'logic',
    'fine-tuning', 'rlhf', 'evaluation', 'metrics'
  ],
  'Digital Marketing Specialist': [
    'seo', 'sem', 'ppc', 'google ads', 'facebook ads', 'linkedin ads', 'social media marketing',
    'content marketing', 'email marketing', 'mailchimp', 'hubspot', 'marketo',
    'google analytics', 'google tag manager', 'google search console', 'ahrefs', 'semrush', 'moz',
    'conversion rate optimization', 'cro', 'a/b testing',
    'copywriting', 'storytelling', 'brand management',
    'crm', 'salesforce', 'data analysis', 'excel', 'roi'
  ],
  'Business Analyst': [
    'requirements gathering', 'business requirements', 'functional requirements', 'user stories',
    'process modeling', 'bpmn', 'uml', 'use cases', 'flowcharts', 'visio', 'lucidchart',
    'data analysis', 'sql', 'excel', 'tableau', 'power bi',
    'agile', 'scrum', 'jira', 'confluence',
    'stakeholder management', 'communication', 'facilitation', 'negotiation',
    'domain knowledge', 'risk analysis', 'cost-benefit analysis', 'swot analysis'
  ],
  'Data Engineer': [
    'sql', 'python', 'scala', 'java', 'bash',
    'etl', 'elt', 'data modeling', 'data warehousing', 'data lakes',
    'hadoop', 'spark', 'pyspark', 'hive', 'presto', 'trino',
    'airflow', 'luigi', 'dbt', 'nifi', 'kafka', 'kinesis',
    'postgresql', 'mysql', 'mongodb', 'cassandra', 'redis', 'elasticsearch',
    'snowflake', 'bigquery', 'redshift', 'databricks',
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd', 'git'
  ],
  'IoT Engineer': [
    'c', 'c++', 'python', 'java', 'rust',
    'embedded systems', 'microcontrollers', 'arduino', 'raspberry pi', 'esp32', 'arm',
    'rtos', 'freertos', 'linux', 'yocto',
    'sensors', 'actuators', 'electronics', 'pcb design',
    'iot protocols', 'mqtt', 'coap', 'http', 'websockets', 'ble', 'bluetooth', 'zigbee', 'lorawan', 'wifi',
    'cloud platforms', 'aws iot', 'azure iot', 'google cloud iot',
    'edge computing', 'security', 'cryptography', 'data analysis'
  ]
};

// ─── Career Coach Responses ──────────────────────────────────────────────────
export const COACH_RESPONSES: Record<string, Record<string, string>> = {
  'general': {
    'resume': "### Expert Resume Tips\n\n1.  **Quantify Achievements**: Instead of 'managed projects', use 'managed 5 projects with $50k budget'.\n2.  **Keyword Optimization**: Standardize your tech stack mentions (e.g., use 'React.js' if the JD uses it).\n3.  **Clean Layout**: Use a single-column layout for better ATS readability.",
    'salary': "### Salary Insights\n\nMarket rates vary by location and experience. Generally:\n*   **Entry Level**: $60k - $85k\n*   **Mid Level**: $90k - $130k\n*   **Senior Level**: $140k+\n\n*Check local listings on Glassdoor or levels.fyi for precise data.*",
    'interview': "### Interview Prep Strategy\n\n1.  **STAR Method**: Prepare 5 stories using Situation, Task, Action, and Result.\n2.  **Technical Fundamentals**: Brush up on Data Structures, Algorithms, and System Design.\n3.  **Behavioral**: Be ready to talk about a time you failed and how you handled it.",
    'fallback': "I'm here to help! You can ask me about **interview prep**, **resume tips**, **salary insights**, or how to master specific **skills** for your target role."
  },
  'Backend Developer': {
    'skills': "For a **Backend Developer**, focus on:\n*   **Advanced SQL**: Common Table Expressions (CTEs) and indexing.\n*   **System Design**: Load balancing, caching patterns (Redis), and microservices architecture.",
    'interview': "Expect questions on **concurrency**, **database normalization**, and **REST vs GraphQL** design principles.",
    'resume': "Highlight your experience with **distributed systems** and **API performance optimization**.",
    'salary': "Backend roles often command a premium for expertise in **JVM (Java/Kotlin)** or **Go** in high-scale environments."
  },
  'Frontend Developer': {
    'skills': "To excel as a **Frontend Developer**, master:\n*   **Performance Optimization**: Core Web Vitals and code splitting.\n*   **State Management**: Deep dive into Redux Toolkit, React Query, or Zustand.",
    'interview': "Be ready for live coding tasks using **React hooks** and explaining **CSS Box Model** or **Event Delegation**.",
    'resume': "Showcase your **UI/UX sensibilities** and include links to hosted projects with responsive design.",
    'salary': "Frontend salaries are highly competitive, especially for engineers skilled in **Next.js** and **TypeScript**."
  },
  'Fullstack Engineer': {
    'skills': "As a **Fullstack Engineer**, become 'T-Shaped':\n*   **Integration**: Mastery of connecting complex frontends with robust APIs.\n*   **Infrastructure**: Understand Docker and deployment pipelines (CI/CD).",
    'interview': "You will likely be tested on **building a full feature** from scratch and explaining the **data flow** from DB to UI.",
    'resume': "Focus on your ability to **own a product end-to-end**, from database schema design to responsive UI.",
    'salary': "Fullstack engineers are highly valued for their **versatility**, with top earners specializing in **React + Node.js** or **Next.js**."
  },
  'DevOps Engineer': {
    'skills': "Focus on **Automation** and **Reliability**:\n*   **Infrastructure as Code**: Terraform or Ansible.\n*   **Observability**: Setting up monitoring with Prometheus and Grafana.",
    'interview': "Prepare for 'What if' scenarios focusing on **disaster recovery**, **zero-downtime deployments**, and **security hardening**.",
    'resume': "Emphasize your experience with **Kubernetes** and reducing **deployment lead times**.",
    'salary': "DevOps roles have some of the highest base salaries in tech due to the **specialized infrastructure knowledge** required."
  },
  'Data Scientist': {
    'skills': "Prioritize **Storytelling** and **Deployment**:\n*   **Statistics**: Deep understanding of p-values and distributions.\n*   **MLOps**: Learning how to wrap models in APIs using FastAPI or Flask.",
    'interview': "Expect a **business case study** where you must decide which metrics matter most and explain your model to a non-technical audience.",
    'resume': "Quantify your impact: 'Improved model accuracy by 15%, leading to a $200k revenue increase'.",
    'salary': "Data Science salaries remain high, with a premium on **Machine Learning Engineering** and **Big Data** expertise."
  },
  'UI/UX Designer': {
    'skills': "Focus on **Systems** and **Empathy**:\n*   **Design Systems**: Creating reusable component libraries in Figma.\n*   **User Research**: Mastery of conducting and synthesizing user interviews.",
    'interview': "Be ready for a **Portfolio Review** and a **Whiteboard Design Challenge** focusing on problem-solving rather than just aesthetics.",
    'resume': "Your portfolio is your resume. Highlight **user-centric outcomes** and iterative design processes.",
    'salary': "Senior Designers with **Design System** and **Product Strategy** skills can reach engineering-level salaries."
  },
  'Mobile Developer': {
    'skills': "Master **Platform Nuance** and **Lifecycle**:\n*   **Offline First**: Implementing robust local caching with SQLite or Realm.\n*   **Animations**: Using native tools like Swift UI or Jetpack Compose for fluid UI.",
    'interview': "You'll be asked about **memory management**, **background processes**, and **app store submission** workflows.",
    'resume': "Include App Store links. Highlight experience with **cross-platform frameworks (Flutter/React Native)** vs **Native**.",
    'salary': "Mobile developers are in high demand, particularly those with expertise in both **iOS (Swift)** and **Android (Kotlin)**."
  },
  'Artificial Intelligence / Machine Learning Engineer': {
    'skills': "Focus on **Mathematical Foundations** and **Hardware Optimization**:\n*   **Linear Algebra & Calculus**: Deep understanding for backpropagation.\n*   **NVIDIA CUDA/Triton**: Optimizing model inference on GPUs.",
    'interview': "Be prepared to derive **loss functions** on a whiteboard and explain **Transformers** architecture in detail.",
    'resume': "List your experience with **PyTorch/TensorFlow** and any published research or high-impact ML pipelines.",
    'salary': "AI/ML engineering is currently the highest-paying technical bracket, especially for those with **generative AI** and **LLM** experience."
  },
  'Cybersecurity Engineer': {
    'skills': "Focus on **Defense-in-Depth** and **Cloud Security**:\n*   **Ethical Hacking**: Understanding adversarial mindsets (Pentesting).\n*   **DevSecOps**: Integrating security checks into CI/CD pipelines.",
    'interview': "Expect 'Incident Response' drills and deep dives into **OWASP Top 10** or **Zero Trust** architectures.",
    'resume': "Certifications like **OSCP** or **CISSP** carry significant weight. Highlight your history of **vulnerability remediation**.",
    'salary': "Cybersecurity is recession-proof. Highest salaries are found in **FinTech** and **Cloud Infrastructure Security**."
  },
  'Cloud Engineer': {
    'skills': "Master **Multi-cloud** and **Cost Optimization**:\n*   **Networking**: Deep understanding of VPCs, Subnets, and BGP.\n*   **FinOps**: Analyzing and reducing monthly cloud spend without impacting performance.",
    'interview': "You'll be asked to design a **High Availability (HA)** architecture across multiple regions during a whiteboard session.",
    'resume': "Highlight your **Terraform/CloudFormation** scripts and successful **on-prem to cloud migrations**.",
    'salary': "Cloud Architects and Engineers for **AWS/Azure** are consistently among the top 5 highest-paid IT roles."
  },
  'Product Manager': {
    'skills': "Master **Prioritization** and **Influence**:\n*   **RICE Framework**: Data-driven methods for deciding what to build next.\n*   **Product Analytics**: Using Mixpanel/Amplitude to track user retention.",
    'interview': "Expect 'Product Sense' questions like 'How would you improve Spotify's onboarding?' and behavioral 'Conflict' questions.",
    'resume': "Focus on **Product-Market Fit** metrics. 'Launched X feature which grew DAUs by 30%'.",
    'salary': "PM salaries track closely with Engineering, with a heavy emphasis on **equity** and **performance bonuses**."
  },
  'Robotics Engineer': {
    'skills': "Master **Hardware-Software Integration**:\n*   **ROS/ROS2**: The industry standard for robotic communication.\n*   **Control Theory**: PID loops and motion planning for smooth actuator movement.",
    'interview': "Expect questions on **inverse kinematics**, **sensor fusion (LiDAR/IMU)**, and **real-time C++** programming.",
    'resume': "Showcase physical projects. Links to videos of your robots in motion are highly effective.",
    'salary': "Robotics roles in **Autonomous Vehicles** and **Medical Devices** are exceptionally high-paying."
  },
  'Blockchain Developer': {
    'skills': "Focus on **Security** and **Decentralized Logic**:\n*   **Solidity/Rust**: Mastery of smart contract languages.\n*   **Gas Optimization**: Writing code that minimizes transaction fees on-chain.",
    'interview': "Prepare for deep dives into **consensus mechanisms (PoS/PoW)** and the **EVM (Ethereum Virtual Machine)**.",
    'resume': "Highlight your audited contracts. Any contribution to **DeFi protocols** is a massive green flag.",
    'salary': "Blockchain salaries are legendary, often including **token grants** that significantly boost total compensation."
  },
  'AI Prompt Engineer': {
    'skills': "Master **Semantic Design** and **Orchestration**:\n*   **Chain-of-Thought**: Crafting multi-step reasoning prompts.\n*   **LangChain/LlamaIndex**: Building RAG systems over private data.",
    'interview': "You'll be asked to solve a reasoning problem using an LLM and explain how to mitigate **hallucinations**.",
    'resume': "Showcase 'Success Rates' of your prompts. Mention experience with **Prompt Injection prevention**.",
    'salary': "A new but high-paying field. Salaries are highest in **AI Startups** and **Enterprise AI transformation** roles."
  },
  'Digital Marketing Specialist': {
    'skills': "Master **Attribution** and **Growth Hacking**:\n*   **Performance Marketing**: Deep knowledge of Google/Meta Ads bidding.\n*   **Content SEO**: Understanding topical authority and semantic search.",
    'interview': "Expect a 'Campaign Audit' challenge. 'Here is $10k, how would you drive 500 signups next week?'.",
    'resume': "Numbers are everything. 'Reduced CAC by 40% while scaling spend by 3x'.",
    'salary': "Marketing salaries have a high ceiling for **Performance Marketing** and **Growth leads**."
  },
  'Business Analyst': {
    'skills': "Master **Translation** and **BI**:\n*   **BPMN 2.0**: Mapping complex business processes visually.\n*   **SQL & Tableau**: Turning messy data into executive-level dashboards.",
    'interview': "Expect 'Process Improvement' case studies and 'Requirement Conflicts' behavioral scenarios.",
    'resume': "Focus on efficiency gains. 'Automated X report, saving the team 20 hours per week'.",
    'salary': "Balanced salaries with high stability. Premium pay for **BAs in SAP/Salesforce** or **FinTech**."
  },
  'Data Engineer': {
    'skills': "Master **Pipelining** and **Data Modeling**:\n*   **Spark/Flink**: Processing petabytes of data at scale.\n*   **dbt**: Managing data transformations as version-controlled code.",
    'interview': "Expect 'Star Schema' design questions and 'Data Infrastructure' architecture challenges.",
    'resume': "Highlight your experience with **Airflow** and reducing **Data Pipeline latency**.",
    'salary': "Data Engineers often earn *more* than Data Scientists because they build the **mission-critical infrastructure**."
  },
  'IoT Engineer': {
    'skills': "Master **Connectivity** and **Power Management**:\n*   **Embedded C/C++**: Writing code for memory-constrained devices.\n*   **MQTT/LoRaWAN**: Efficient communication protocols for remote sensors.",
    'interview': "Expect questions on **Sleep Modes**, **Serial Communication (I2C/SPI)**, and **OTA Updates**.",
    'resume': "Showcase end-to-end projects: 'From sensor node to cloud dashboard'.",
    'salary': "Specialized roles in **Smart Home** and **Industrial IoT** command very strong salaries."
  }
};

/**
 * Custom keyword-matching coach engine
 */
export function getCoachResponse(query: string, role: string): { text: string; suggestions: string[] } {
  const lowQuery = query.toLowerCase();
  const roleData = COACH_RESPONSES[role] || {};
  const general = COACH_RESPONSES['general'];

  let text = general.fallback;
  let suggestions = [
    `Best skills for ${role}`,
    `Interview prep for ${role}`,
    `Resume tips for ${role}`,
    `Salary for ${role}`
  ];

  // Topic matching
  if (lowQuery.includes('resume') || lowQuery.includes('cv') || lowQuery.includes('portfolio')) {
    text = roleData.resume || general.resume;
    suggestions = [`${role} Interview prep`, `Skills needed for ${role}`, `Projects for ${role}`];
  } else if (lowQuery.includes('salary') || lowQuery.includes('pay') || lowQuery.includes('money') || lowQuery.includes('earn')) {
    text = roleData.salary || general.salary;
    suggestions = [`Negotiation tips`, `${role} Resume tips`, `Market trends for ${role}`];
  } else if (lowQuery.includes('interview') || lowQuery.includes('question') || lowQuery.includes('hiring')) {
    text = roleData.interview || general.interview;
    suggestions = [`Technical skills for ${role}`, `Behavioral questions`, `Mock interview tips`];
  } else if (lowQuery.includes('skill') || lowQuery.includes('learn') || lowQuery.includes('study') || lowQuery.includes('path')) {
    text = roleData.skills || general.skills;
    suggestions = [`Recommended projects`, `${role} Certifications`, `Advanced ${role} topics`];
  } else if (lowQuery.includes('project') || lowQuery.includes('build') || lowQuery.includes('work')) {
    text = `I recommend starting with practical projects! For a **${role}**, check out the **Projects** page in the sidebar for a curated list of ${role}-specific challenges.`;
    suggestions = [`Skills for ${role}`, `${role} Resume tips`, `Interview prep` ];
  }

  return { text, suggestions };
}

// ─── Project Bank ─────────────────────────────────────────────────────────────
export const PROJECT_BANK: Record<string, AnalysisResult['recommendedProjects']> = {
  'Backend Developer': [
    { title: 'REST API with Auth', description: 'Build a production-ready REST API with JWT authentication, rate limiting, and PostgreSQL.', techStack: ['Node.js', 'Express', 'PostgreSQL', 'JWT'], difficulty: 'Beginner', skills_practiced: ['REST API', 'Authentication', 'SQL', 'Node.js', 'Express', 'PostgreSQL', 'JWT'] },
    { title: 'Real-time Chat Service', description: 'WebSocket-based chat with Redis pub/sub for horizontal scaling.', techStack: ['Node.js', 'Socket.io', 'Redis'], difficulty: 'Intermediate', skills_practiced: ['WebSocket', 'Redis', 'Caching', 'Node.js', 'Socket.io'] },
    { title: 'Microservices E-Commerce', description: 'Decomposed e-commerce system with separate auth, product, and order services.', techStack: ['Go', 'Docker', 'Kafka', 'Kubernetes'], difficulty: 'Advanced', skills_practiced: ['Microservices', 'Docker', 'Kafka', 'Kubernetes', 'Go'] },
    { title: 'GraphQL API Gateway', description: 'Unified GraphQL API aggregating multiple REST services.', techStack: ['Node.js', 'Apollo', 'PostgreSQL'], difficulty: 'Intermediate', skills_practiced: ['GraphQL', 'API Design', 'Node.js', 'Apollo', 'PostgreSQL'] },
    { title: 'Serverless Video Transcoder', description: 'Upload videos to an S3 bucket and trigger an AWS Lambda function to transcode them.', techStack: ['AWS Lambda', 'S3', 'FFmpeg', 'Node.js'], difficulty: 'Advanced', skills_practiced: ['AWS', 'Lambda', 'Serverless', 'S3', 'Node.js'] },
    { title: 'Task Scheduler Queue', description: 'Distributed background job processing system built with Redis and Celery.', techStack: ['Python', 'Celery', 'Redis', 'PostgreSQL'], difficulty: 'Intermediate', skills_practiced: ['Message Queue', 'Celery', 'Redis', 'Python', 'PostgreSQL'] },
    { title: 'High-Performance URL Shortener', description: 'Scalable URL shortener using Go, Redis caching, and Cassandra.', techStack: ['Go', 'Redis', 'Cassandra'], difficulty: 'Intermediate', skills_practiced: ['Go', 'Redis', 'Cassandra', 'Caching', 'Scalability'] },
    { title: 'Distributed Lock Manager', description: 'Implement a highly available lock service using the Redlock algorithm.', techStack: ['Go', 'Redis'], difficulty: 'Advanced', skills_practiced: ['Distributed Systems', 'Go', 'Redis'] },
    { title: 'API Gateway with Rate Limiting', description: 'Custom gateway that handles request routing and leaky-bucket rate limiting.', techStack: ['Node.js', 'Redis', 'Express'], difficulty: 'Intermediate', skills_practiced: ['API Gateway', 'Performance', 'Redis'] }
  ],
  'Frontend Developer': [
    { title: 'Component Design System', description: 'Build a reusable UI library with Storybook documentation and theme tokens.', techStack: ['React', 'Tailwind', 'Storybook'], difficulty: 'Beginner', skills_practiced: ['React', 'CSS', 'Design Systems', 'Tailwind', 'Storybook'] },
    { title: 'Dashboard with Real-time Data', description: 'Analytics dashboard with live charts using WebSocket updates.', techStack: ['React', 'Recharts', 'WebSocket'], difficulty: 'Intermediate', skills_practiced: ['State Management', 'WebSocket', 'Charts', 'React', 'Recharts'] },
    { title: 'Full-Featured Blog Platform', description: 'JAMstack blog with SSG, SEO optimization, and comment system.', techStack: ['Next.js', 'MDX', 'Tailwind'], difficulty: 'Intermediate', skills_practiced: ['Next.js', 'SEO', 'SSG', 'Tailwind'] },
    { title: 'Accessibility Audit Tool', description: 'Chrome extension that scans pages for WCAG compliance violations.', techStack: ['TypeScript', 'Chrome API', 'React'], difficulty: 'Advanced', skills_practiced: ['Accessibility', 'TypeScript', 'Browser APIs', 'React'] },
    { title: 'E-commerce Storefront', description: 'Progressive Web App (PWA) e-commerce site with offline cart support and Redux Toolkit.', techStack: ['React', 'Redux Toolkit', 'PWA'], difficulty: 'Intermediate', skills_practiced: ['PWA', 'Redux Toolkit', 'React', 'State Management'] },
    { title: 'Interactive 3D Data Viz', description: 'Visualize complex datasets in the browser using Three.js and React Three Fiber.', techStack: ['React', 'Three.js', 'WebGL'], difficulty: 'Advanced', skills_practiced: ['Three.js', 'Animation', 'React'] },
    { title: 'Kanban Board Clone', description: 'Trello-like drag and drop task management board with optimistic UI updates.', techStack: ['Vue', 'Vuex', 'Tailwind'], difficulty: 'Intermediate', skills_practiced: ['Vue', 'Vuex', 'Tailwind', 'State Management'] },
    { title: 'Music Player with Audio API', description: 'High-fidelity audio player using the Web Audio API for real-time sound visualization.', techStack: ['React', 'Web Audio API', 'Framer Motion'], difficulty: 'Intermediate', skills_practiced: ['Web Audio', 'UI/UX', 'React'] },
    { title: 'Virtual Scroll for Big Data', description: 'A custom high-performance list component that renders millions of rows smoothly.', techStack: ['TypeScript', 'React'], difficulty: 'Advanced', skills_practiced: ['Performance', 'DOM Optimization'] }
  ],
  'Fullstack Engineer': [
    { title: 'SaaS Boilerplate', description: 'Full-stack template with auth, billing, email, and team management.', techStack: ['Next.js', 'Prisma', 'Stripe', 'PostgreSQL'], difficulty: 'Intermediate', skills_practiced: ['Fullstack', 'Auth', 'Payments', 'Next.js', 'Prisma', 'PostgreSQL'] },
    { title: 'Social Media Clone', description: 'Twitter-like app with feeds, follows, likes, and real-time notifications.', techStack: ['React', 'Node.js', 'MongoDB', 'Socket.io'], difficulty: 'Intermediate', skills_practiced: ['Fullstack', 'Real-time', 'NoSQL', 'React', 'Node.js', 'MongoDB', 'Socket.io'] },
    { title: 'Collaborative Document Editor', description: 'Google Docs-style editor with operational transforms and live presence.', techStack: ['React', 'Node.js', 'Y.js', 'WebSocket'], difficulty: 'Advanced', skills_practiced: ['CRDT', 'WebSocket', 'Collaboration', 'React', 'Node.js'] },
    { title: 'Marketplace Platform', description: 'Two-sided marketplace with user reviews, image uploads to S3, and elastic search.', techStack: ['Vue', 'Express', 'Elasticsearch', 'AWS S3'], difficulty: 'Advanced', skills_practiced: ['Vue', 'Express', 'Elasticsearch', 'AWS', 'Fullstack'] },
    { title: 'Expense Tracker with OCR', description: 'Upload receipts and extract total amounts using a Cloud Vision API.', techStack: ['Angular', 'Spring Boot', 'PostgreSQL'], difficulty: 'Intermediate', skills_practiced: ['Angular', 'Spring Boot', 'PostgreSQL', 'API Integration'] },
    { title: 'Real-time Collaborative Whiteboard', description: 'Infinite canvas with multi-user drawing using Canvas API and WebSockets.', techStack: ['React', 'Socket.io', 'Canvas API'], difficulty: 'Advanced', skills_practiced: ['WebSockets', 'Real-time', 'Graphics'] },
    { title: 'E-Learning Management System', description: 'Build a platform with course progress tracking, video streaming, and certificates.', techStack: ['Next.js', 'Firebase', 'Mux'], difficulty: 'Intermediate', skills_practiced: ['Fullstack', 'Video', 'Authentication'] },
    { title: 'Multi-tenant SaaS Platform', description: 'Complex architecture with subdomains, shared DB with row-level security, and per-tenant config.', techStack: ['Next.js', 'Supabase', 'Tailwind'], difficulty: 'Advanced', skills_practiced: ['SaaS Architecture', 'Security', 'Database Design'] }
  ],
  'DevOps Engineer': [
    { title: 'Kubernetes Cluster Setup', description: 'Deploy a multi-node K8s cluster with monitoring, logging, and auto-scaling.', techStack: ['Kubernetes', 'Helm', 'Prometheus', 'Grafana'], difficulty: 'Advanced', skills_practiced: ['K8s', 'Monitoring', 'Scaling', 'Kubernetes', 'Helm', 'Prometheus', 'Grafana'] },
    { title: 'CI/CD Pipeline', description: 'GitHub Actions pipeline with testing, Docker build, and zero-downtime deploy.', techStack: ['GitHub Actions', 'Docker', 'AWS'], difficulty: 'Intermediate', skills_practiced: ['CI/CD', 'Docker', 'AWS', 'GitHub Actions'] },
    { title: 'Infrastructure as Code', description: 'Provision a full AWS VPC with Terraform — subnets, security groups, and RDS.', techStack: ['Terraform', 'AWS', 'Ansible'], difficulty: 'Intermediate', skills_practiced: ['IaC', 'Terraform', 'Cloud', 'AWS', 'Ansible'] },
    { title: 'Automated Disaster Recovery', description: 'Scripted daily backups of database snapshots mapped to a multi-region S3 bucket.', techStack: ['Bash', 'AWS CLI', 'Cron'], difficulty: 'Intermediate', skills_practiced: ['Bash', 'AWS', 'Scripting', 'Linux'] },
    { title: 'Zero Trust Network Setup', description: 'Implementation of Istio service mesh across a Kubernetes cluster for mTLS.', techStack: ['Istio', 'Kubernetes', 'Envoy'], difficulty: 'Advanced', skills_practiced: ['Istio', 'Kubernetes', 'Security', 'Networking'] },
    { title: 'Secret Management with Vault', description: 'Integrate HashiCorp Vault into a CI/CD pipeline for secure credential injection.', techStack: ['Vault', 'GitHub Actions', 'Docker'], difficulty: 'Intermediate', skills_practiced: ['Security', 'DevOps', 'Infrastructure'] },
    { title: 'Auto-Scaling Multi-cloud Cluster', description: 'Terraform scripts to provision a hybrid cluster across AWS and GCP with failover.', techStack: ['Terraform', 'Multi-cloud', 'K8s'], difficulty: 'Advanced', skills_practiced: ['IaC', 'Resilience', 'Cloud Architecture'] }
  ],
  'Data Scientist': [
    { title: 'Churn Prediction Model', description: 'Train and deploy a customer churn classifier with SHAP explanations.', techStack: ['Python', 'Scikit-learn', 'FastAPI', 'Docker'], difficulty: 'Beginner', skills_practiced: ['ML', 'Classification', 'Deployment', 'Python', 'Scikit-learn', 'FastAPI', 'Docker'] },
    { title: 'NLP Sentiment Analyser', description: 'Fine-tune a BERT model for domain-specific sentiment classification.', techStack: ['Python', 'HuggingFace', 'PyTorch'], difficulty: 'Intermediate', skills_practiced: ['NLP', 'Deep Learning', 'Transformers', 'Python', 'HuggingFace', 'PyTorch'] },
    { title: 'Real-time ML Pipeline', description: 'Streaming feature engineering and inference pipeline using Kafka + MLflow.', techStack: ['Python', 'Kafka', 'MLflow', 'Spark'], difficulty: 'Advanced', skills_practiced: ['MLOps', 'Streaming', 'Kafka', 'Python', 'MLflow', 'Spark'] },
    { title: 'Recommendation Engine', description: 'Collaborative filtering recommender system using alternating least squares (ALS).', techStack: ['PySpark', 'Hadoop', 'SQL'], difficulty: 'Intermediate', skills_practiced: ['Spark', 'PySpark', 'Machine Learning', 'SQL'] },
    { title: 'Interactive Data Dashboard', description: 'Dashboard serving aggregate analytics and predictive trends over billions of rows.', techStack: ['Streamlit', 'Pandas', 'Snowflake'], difficulty: 'Intermediate', skills_practiced: ['Streamlit', 'Pandas', 'Snowflake', 'Visualization'] },
    { title: 'Stock Market Prophet', description: 'Time-series forecasting model for stock prices using Facebook Prophet and Yahoo Finance.', techStack: ['Python', 'Prophet', 'Pandas'], difficulty: 'Intermediate', skills_practiced: ['Time Series', 'Prediction', 'Finance'] },
    { title: 'Neural Style Transfer App', description: 'Deploy a CNN that applies famous artistic styles to user-uploaded photos.', techStack: ['PyTorch', 'FastUI', 'Python'], difficulty: 'Advanced', skills_practiced: ['Deep Learning', 'Computer Vision'] }
  ],
  'Mobile Developer': [
    { title: 'Fitness Tracker App', description: 'Cross-platform app tracking runs using GPS, saving routes to local SQLite.', techStack: ['Flutter', 'Dart', 'SQLite'], difficulty: 'Beginner', skills_practiced: ['Flutter', 'Dart', 'SQLite', 'Mobile'] },
    { title: 'Social Photo Sharing App', description: 'Native iOS app with Core Data caching, camera filters, and Firebase backend.', techStack: ['Swift', 'Core Data', 'Firebase'], difficulty: 'Intermediate', skills_practiced: ['Swift', 'iOS', 'Core Data', 'Firebase'] },
    { title: 'E-commerce Mobile App', description: 'React Native app featuring Stripe payments, push notifications, and Redux.', techStack: ['React Native', 'Redux', 'Stripe'], difficulty: 'Intermediate', skills_practiced: ['React Native', 'Redux', 'Push Notifications', 'Mobile'] },
    { title: 'Offline-First Note App', description: 'Android app using Room database, background syncing workers, and Jetpack Compose.', techStack: ['Kotlin', 'Android', 'Room', 'Jetpack Compose'], difficulty: 'Intermediate', skills_practiced: ['Kotlin', 'Android', 'Jetpack Compose', 'Room'] },
    { title: 'AR Furniture Placer', description: 'Augmented Reality app to visualize 3D furniture in your room using ARCore/ARKit.', techStack: ['Unity', 'ARCore', 'C#'], difficulty: 'Advanced', skills_practiced: ['AR', '3D Graphics', 'Unity'] },
    { title: 'Bluetooth Home Automation', description: 'Control appliances via BLE using a custom mobile dashboard.', techStack: ['React Native', 'BLE', 'Nordic SDK'], difficulty: 'Intermediate', skills_practiced: ['BLE', 'Mobile', 'IoT'] },
    { title: 'Workout Tracker with SwiftUI', description: 'Native iOS app with HealthKit integration to track exercises and calories.', techStack: ['SwiftUI', 'HealthKit', 'Core Data'], difficulty: 'Intermediate', skills_practiced: ['iOS', 'HealthKit', 'Mobile'] },
    { title: 'Offline Map Navigator', description: 'Flutter app that allows users to download and navigate maps without internet.', techStack: ['Flutter', 'OpenStreetMap', 'SQLite'], difficulty: 'Advanced', skills_practiced: ['Flutter', 'Offline Sync', 'Geolocation'] }
  ],
  'IoT Engineer': [
    { title: 'Temperature Sensor Monitor', description: 'Read temp data from an ESP32 and display it on a web server.', techStack: ['C++', 'ESP32', 'HTTP'], difficulty: 'Beginner', skills_practiced: ['Microcontrollers', 'C++', 'Sensors'] },
    { title: 'MQTT Smart Home Hub', description: 'Publish sensor data to an MQTT broker and subscribe to control a light.', techStack: ['Python', 'MQTT', 'Raspberry Pi'], difficulty: 'Intermediate', skills_practiced: ['IoT Protocols', 'Python', 'Hardware Basics'] },
    { title: 'Cloud-Connected Fleet Tracker', description: 'Securely sync GPS data to AWS IoT Core using mutual TLS authentication.', techStack: ['AWS IoT', 'C', 'Cryptography'], difficulty: 'Advanced', skills_practiced: ['Cloud Integration', 'Security', 'Edge Computing'] },
    { title: 'Smart Agriculture Sensor Node', description: 'Solar-powered LoRaWAN node for soil moisture and sun tracking.', techStack: ['C++', 'LoRaWAN', 'Electronics'], difficulty: 'Intermediate', skills_practiced: ['LoRaWAN', 'Embedded', 'Low Power Design'] },
    { title: 'Voice-Controlled Home Bot', description: 'Build a Raspbery Pi powered assistant with local voice processing.', techStack: ['Python', 'RasPi', 'PocketSphinx'], difficulty: 'Advanced', skills_practiced: ['Robotics', 'Speech Processing', 'Python'] },
    { title: 'Industrial Vibration Monitor', description: 'Analyze motor vibration patterns to predict failure using an MPU6050 and ESP32.', techStack: ['C', 'ESP32', 'FFT'], difficulty: 'Advanced', skills_practiced: ['Signal Processing', 'Predictive Maintenance'] },
    { title: 'Smart Mirror Dashboard', description: 'Magic mirror project displaying news, weather, and schedule using a RasPi.', techStack: ['JavaScript', 'Electron', 'RasPi'], difficulty: 'Intermediate', skills_practiced: ['IoT', 'System Design'] }
  ],
  'Artificial Intelligence / Machine Learning Engineer': [
    { title: 'Custom CNN Image Classifier', description: 'Build and train a Deep Learning model to classify architectural styles in images.', techStack: ['PyTorch', 'Python', 'OpenCV'], difficulty: 'Intermediate', skills_practiced: ['Computer Vision', 'Deep Learning', 'PyTorch'] },
    { title: 'Fraud Detection Pipeline', description: 'Real-time anomaly detection system for financial transactions using XGBoost.', techStack: ['Python', 'Scikit-learn', 'Kafka'], difficulty: 'Advanced', skills_practiced: ['Machine Learning', 'Kafka', 'Data Engineering'] },
    { title: 'Autonomous Drone Navigator', description: 'Train an RL agent to navigate a drone through a forest in a simulator.', techStack: ['Python', 'PyTorch', 'AirSim'], difficulty: 'Advanced', skills_practiced: ['Reinforcement Learning', 'Simulation', 'AI'] },
    { title: 'Style Transfer App', description: 'Mobile app applying artistic styles to camera feed in real-time.', techStack: ['TensorFlow Lite', 'Python', 'React Native'], difficulty: 'Intermediate', skills_practiced: ['Edge AI', 'Optimization'] },
    { title: 'Real-time Object Tracker', description: 'Build a high-FPS object detection and tracking system using YOLO and OpenCV.', techStack: ['Python', 'YOLOv8', 'OpenCV'], difficulty: 'Advanced', skills_practiced: ['Computer Vision', 'Deep Learning'] },
    { title: 'Voice Emotion Recognizer', description: 'Analyze audio clips to detect human emotions using CNNs and Librosa.', techStack: ['Python', 'Librosa', 'Keras'], difficulty: 'Intermediate', skills_practiced: ['Audio Processing', 'Classification'] }
  ],
  'Cybersecurity Engineer': [
    { title: 'Network Intrusion Detector', description: 'Create a packet sniffer that identifies suspicious traffic patterns using signatures.', techStack: ['Python', 'Scapy', 'Linux'], difficulty: 'Intermediate', skills_practiced: ['Networking', 'Cybersecurity', 'Python'] },
    { title: 'Zero-Trust Proxy Implementation', description: 'Build a secure reverse proxy with mTLS and identity-based access control.', techStack: ['Go', 'Docker', 'Oauth2'], difficulty: 'Advanced', skills_practiced: ['Security', 'Identity', 'Go'] },
    { title: 'Vulnerability Scanner', description: 'Automated tool to scan projects for common OWASP Top 10 vulnerabilities.', techStack: ['Python', 'Docker', 'OWASP Tooling'], difficulty: 'Intermediate', skills_practiced: ['AppSec', 'Penetration Testing'] },
    { title: 'SIEM Log Analyzer', description: 'Aggregate and analyze system logs for suspicious activity with ELK stack.', techStack: ['Elasticsearch', 'Logstash', 'Kibana'], difficulty: 'Intermediate', skills_practiced: ['Monitoring', 'Incident Response'] },
    { title: 'Ransomware Lab Simulator', description: 'Design a safe sandbox to test encryption/decryption patterns for malware research.', techStack: ['C#', 'Cryptography', 'VirtualBox'], difficulty: 'Advanced', skills_practiced: ['Malware Analysis', 'Security Research'] },
    { title: 'SSH Brute Force Detector', description: 'Analyze server logs in real-time to block IP addresses attempting brute force attacks.', techStack: ['Go', 'Fail2Ban', 'Linux'], difficulty: 'Intermediate', skills_practiced: ['Log Analysis', 'Linux Security'] }
  ],
  'Cloud Engineer': [
    { title: 'Global CDN Deployment', description: 'Implement a multi-region static content delivery system with edge caching.', techStack: ['AWS CloudFront', 'S3', 'Terraform'], difficulty: 'Intermediate', skills_practiced: ['Cloud Architecture', 'IaC', 'Networking'] },
    { title: 'Autoscaling Micro-service Tier', description: 'Provision a containerized web fleet that scales based on custom SQM metrics.', techStack: ['Azure', 'Kubernetes', 'Bicep'], difficulty: 'Advanced', skills_practiced: ['Autoscaling', 'Kubernetes', 'Cloud'] },
    { title: 'Multicloud Storage Gateway', description: 'A S3-compatible API that spreads data across AWS, GCP, and Azure for high availability.', techStack: ['Go', 'Terraform', 'SDKs'], difficulty: 'Advanced', skills_practiced: ['Cloud Architecture', 'Resilience'] },
    { title: 'Serverless FinTech API', description: 'Fully serverless payment processor using Lambda, DynamoDB, and API Gateway.', techStack: ['AWS', 'Node.js', 'DynamoDB'], difficulty: 'Intermediate', skills_practiced: ['Serverless', 'NoSQL'] },
    { title: 'Serverless Image Resizer', description: 'Event-driven architecture that automatically resizes images uploaded to a bucket.', techStack: ['AWS CDK', 'TypeScript', 'Sharp'], difficulty: 'Intermediate', skills_practiced: ['AWS CDK', 'Event-Driven'] },
    { title: 'K8s Sidecar Logging Agent', description: 'Build a lightweight Go agent that runs as a sidecar to ship logs to a central server.', techStack: ['Go', 'Docker', 'K8s'], difficulty: 'Advanced', skills_practiced: ['Kubernetes', 'Go', 'Systems Design'] }
  ],
  'Product Manager': [
    { title: 'Data-Driven Product Spec', description: 'Create a detailed PRD for a new feature using A/B test results and user telemetry.', techStack: ['Jira', 'Mixpanel', 'Figma'], difficulty: 'Intermediate', skills_practiced: ['Documentation', 'Product Strategy', 'Analytics'] },
    { title: 'GTM Strategy for SaaS', description: 'Develop a comprehensive Go-To-Market plan including pricing models and segment analysis.', techStack: ['Market Research', 'Excel'], difficulty: 'Advanced', skills_practiced: ['Strategy', 'Prioritization', 'Leadership'] },
    { title: 'Mobile App Feature Roadmap', description: 'Prioritize a 6-month roadmap for a social app based on user feedback and technical debt.', techStack: ['Productboard', 'Strategy'], difficulty: 'Intermediate', skills_practiced: ['Roadmapping', 'User Feedback Synthesis'] },
    { title: 'Competitive Intelligence Audit', description: 'Analyze 3 major competitors and propose 2 unique value propositions for a new startup.', techStack: ['Research', 'SWOT'], difficulty: 'Beginner', skills_practiced: ['Market Analysis', 'Problem Discovery'] },
    { title: 'Product-Market Fit Survey', description: 'Build a specialized micro-survey tool to calculate PMF score from active users.', techStack: ['React', 'Supabase'], difficulty: 'Intermediate', skills_practiced: ['Product Analytics', 'UX Research'] },
    { title: 'Agile Velocity Dashboard', description: 'Custom Google Sheets/Excel dashboard to track team velocity and sprint burn-down.', techStack: ['Excel', 'Agile Tools'], difficulty: 'Beginner', skills_practiced: ['Data Analysis', 'Project Management'] }
  ],
  'UI/UX Designer': [
    { title: 'Enterprise Design System', description: 'Architect a scalable library of accessible UI components with design tokens.', techStack: ['Figma', 'Tokens', 'WCAG'], difficulty: 'Advanced', skills_practiced: ['Design Systems', 'Accessibility', 'Figma'] },
    { title: 'User Onboarding Redesign', description: 'Perform usability testing and redesign a complex SaaS onboarding flow.', techStack: ['Figma', 'Prototyping', 'User Research'], difficulty: 'Intermediate', skills_practiced: ['User Research', 'Prototyping', 'UI Design'] },
    { title: 'Micro-interaction Library', description: 'Design 10 high-fidelity micro-interactions for a mobile banking app.', techStack: ['After Effects', 'Figma', 'Protopie'], difficulty: 'Advanced', skills_practiced: ['Motion Design', 'Interaction Design'] },
    { title: 'Accessible GovTech Portal', description: 'Redesign a public service portal to meet AA accessibility standards.', techStack: ['Inclusive Design', 'Figma'], difficulty: 'Intermediate', skills_practiced: ['Accessibility (WCAG)', 'Empathy Mapping'] },
    { title: 'Neumorphic Design System', description: 'Create a comprehensive UI kit exploring soft-shadow neumorphic aesthetics.', techStack: ['Figma', 'CSS'], difficulty: 'Intermediate', skills_practiced: ['Visual Design', 'UI Trends'] },
    { title: 'Mobile Game Interface', description: 'Complete UI layout and assets for a strategy game, from HUD to Inventory.', techStack: ['Figma', 'Unity', 'Photoshop'], difficulty: 'Advanced', skills_practiced: ['Game Design', 'Asset Management'] },
    { title: 'Interactive VR Shopping UI', description: 'Design a spatial user interface for an immersive virtual reality shopping experience.', techStack: ['Unity', 'Figma', 'Oculus SDK'], difficulty: 'Advanced', skills_practiced: ['Spatial Design', 'UX for VR'] }
  ],
  'Robotics Engineer': [
    { title: 'SLAM Navigation Bot', description: 'Implement Simultaneous Localization and Mapping on a virtual Gazebo robot.', techStack: ['ROS2', 'C++', 'Lidar'], difficulty: 'Advanced', skills_practiced: ['ROS', 'Path Planning', 'Sensors'] },
    { title: 'PID Motor Controller', description: 'Write a firmware-level PID control loop for precise robotic arm movement.', techStack: ['C', 'Embedded', 'Math'], difficulty: 'Intermediate', skills_practiced: ['Control Theory', 'C', 'Math'] },
    { title: 'Pick-and-Place Vision System', description: 'Use OpenCV to identify objects and coordinate a 4-DOF arm to sort them.', techStack: ['Python', 'OpenCV', 'ROS'], difficulty: 'Advanced', skills_practiced: ['Computer Vision', 'Inverse Kinematics'] },
    { title: 'Legged Robot Balancer', description: 'Code a balancing algorithm for a bipedal or quadruped robot using an IMU.', techStack: ['Arduino', 'C++', 'IMU'], difficulty: 'Intermediate', skills_practiced: ['Stabilization', 'Embedded Systems'] },
    { title: 'Drone Swarm Coordinator', description: 'Algorithm to synchronize flight paths of 5 drones to avoid collisions.', techStack: ['Python', 'MavLink', 'Simulation'], difficulty: 'Advanced', skills_practiced: ['Swarm Intelligence', 'Python', 'Networking'] },
    { title: 'Haptic Feedback Glove', description: 'Build a wearable glove that translates VR hand movements into tactile vibration.', techStack: ['Arduino', 'Bluetooth', 'Sensors'], difficulty: 'Advanced', skills_practiced: ['Wearables', 'Haptics'] }
  ],
  'Blockchain Developer': [
    { title: 'DeFi Liquidity Pool', description: 'Build a decentralized exchange (DEX) smart contract with automated market making.', techStack: ['Solidity', 'Hardhat', 'Ethers.js'], difficulty: 'Advanced', skills_practiced: ['Smart Contracts', 'Solidity', 'Web3'] },
    { title: 'NFT Minting Engine', description: 'Create a scalable gas-efficient contract for generative NFT collections.', techStack: ['Solidity', 'IPFS', 'React'], difficulty: 'Intermediate', skills_practiced: ['NFTs', 'Solidity', 'DApps'] },
    { title: 'DAO Governance Portal', description: 'Frontend and smart contracts for a Decentralized Autonomous Organization.', techStack: ['Solidity', 'Tally', 'React'], difficulty: 'Advanced', skills_practiced: ['Governance', 'Smart Contracts'] },
    { title: 'Supply Chain Tracker', description: 'Private blockchain implementation (Hyperledger) for transparent product tracking.', techStack: ['Hyperledger', 'Node.js', 'Go'], difficulty: 'Intermediate', skills_practiced: ['Enterprise Blockchain', 'Permissioned Networks'] },
    { title: 'Decentralized Voting DApp', description: 'Secure voting system with ZK-proofs to ensure privacy and immutability.', techStack: ['Solidity', 'Circom', 'React'], difficulty: 'Advanced', skills_practiced: ['Cryptography', 'Smart Contracts'] },
    { title: 'Multi-sig Wallet Extension', description: 'Browser extension requiring multiple signatures for high-value transactions.', techStack: ['TypeScript', 'Web3.js', 'Vite'], difficulty: 'Intermediate', skills_practiced: ['Security', 'DApp Development'] }
  ],
  'AI Prompt Engineer': [
    { title: 'Multi-Agent Workflow', description: 'Design a chain-of-thought orchestration for complex code generation tasks.', techStack: ['LangChain', 'GPT-4', 'Python'], difficulty: 'Advanced', skills_practiced: ['Prompt Engineering', 'LLMs', 'Python'] },
    { title: 'Vector Knowledge Base', description: 'Build a RAG system over proprietary PDF documentation using semantic search.', techStack: ['Pinecone', 'OpenAI', 'LlamaIndex'], difficulty: 'Intermediate', skills_practiced: ['RAG', 'Vector DB', 'NLP'] },
    { title: 'Creative Storyteller Bot', description: 'Fine-tune a system prompt for a consistent narrative voice in an AI RPG.', techStack: ['API', 'System Prompts'], difficulty: 'Beginner', skills_practiced: ['Persona Design', 'Few-shot Prompting'] },
    { title: 'Prompt Injection Firewall', description: 'Implement defensive prompting layers to prevent adversarial attacks on an LLM.', techStack: ['Python', 'Safety Guardrails'], difficulty: 'Advanced', skills_practiced: ['Security', 'Defensive Prompting'] },
    { title: 'Multi-Modal Asset Generator', description: 'Pipeline that coordinates text, image, and voice generative models for content creation.', techStack: ['Python', 'OpenAI', 'Stable Diffusion'], difficulty: 'Advanced', skills_practiced: ['AI Integration', 'Orchestration'] },
    { title: 'Prompt Versioning Tool', description: 'A dashboard to A/B test and version prompt iterations across different models.', techStack: ['React', 'FastAPI', 'SQLite'], difficulty: 'Intermediate', skills_practiced: ['Fullstack', 'Workflow Design'] }
  ],
  'Digital Marketing Specialist': [
    { title: 'Full-Funnel Campaign', description: 'Execute a multi-channel digital acquisition strategy with pixel tracking and attribution.', techStack: ['Google Ads', 'Analytics', 'Meta'], difficulty: 'Intermediate', skills_practiced: ['SEM', 'Analytics', 'Digital Strategy'] },
    { title: 'SEO Growth Engine', description: 'Implement a technical SEO roadmap and content strategy to 2x organic traffic.', techStack: ['Ahrefs', 'Search Console'], difficulty: 'Advanced', skills_practiced: ['SEO', 'Content Marketing', 'Strategy'] },
    { title: 'Email Automation Workflow', description: 'Design a complex 7-day nurture sequence with branching logic based on user behavior.', techStack: ['Mailchimp', 'Klaviyo'], difficulty: 'Intermediate', skills_practiced: ['Email Marketing', 'Automation'] },
    { title: 'Social Listening Dashboard', description: 'Monitor brand sentiment across Twitter/Reddit using sentiment analysis APIs.', techStack: ['Python', 'Hootsuite API'], difficulty: 'Advanced', skills_practiced: ['Social Media Analytics', 'Brand Management'] },
    { title: 'CRO Experiment Dashboard', description: 'Design and track a series of A/B tests to optimize landing page conversions.', techStack: ['Google Optimize', 'Mixpanel'], difficulty: 'Intermediate', skills_practiced: ['A/B Testing', 'Conversion Optimization'] },
    { title: 'LinkedIn Content Automator', description: 'Python script to schedule and analyze engagement for thought-leadership posts.', techStack: ['Python', 'LinkedIn API'], difficulty: 'Intermediate', skills_practiced: ['Social Media Automation', 'API Integration'] },
    { title: 'Influencer Marketing Platform', description: 'Build a system to identify, manage, and track ROI from influencer collaborations.', techStack: ['CRM', 'Analytics', 'Social Media APIs'], difficulty: 'Advanced', skills_practiced: ['Influencer Marketing', 'Campaign Management'] },
    { title: 'Personalized Content Engine', description: 'Develop a dynamic content delivery system that tailors website/email content based on user segments.', techStack: ['CMS', 'Marketing Automation', 'A/B Testing'], difficulty: 'Advanced', skills_practiced: ['Personalization', 'Content Strategy', 'Marketing Automation'] }
  ],
  'Business Analyst': [
    { title: 'BPMN Process Overhaul', description: 'Map and optimize a complex supply chain workflow to reduce operational friction.', techStack: ['BPMN 2.0', 'LucidChart'], difficulty: 'Intermediate', skills_practiced: ['Process Modeling', 'Requirements'] },
    { title: 'Executive KPI Dashboard', description: 'Build a real-time BI dashboard visualizing cross-departmental impact metrics.', techStack: ['PowerBI', 'SQL', 'BigQuery'], difficulty: 'Advanced', skills_practiced: ['Data Visualization', 'Stakeholder Management', 'SQL'] },
    { title: 'User Requirement Spec (URS)', description: 'Draft a 30-page functional specification for a legacy software modernization.', techStack: ['Confluence', 'UML'], difficulty: 'Intermediate', skills_practiced: ['Technical Writing', 'Stakeholder Interviews'] },
    { title: 'Financial Risk Model', description: 'Analyze budget variances and project ROI for a new $1M IT initiative.', techStack: ['Excel', 'Monte Carlo'], difficulty: 'Advanced', skills_practiced: ['Financial Analysis', 'Risk Management'] },
    { title: 'Customer Lifetime Value Model', description: 'Predict future revenue from customer segments using historical purchase data.', techStack: ['SQL', 'Python', 'Tableau'], difficulty: 'Advanced', skills_practiced: ['Data Analysis', 'Financial Modeling'] },
    { title: 'Supply Chain Risk Audit', description: 'Assess and visualize vulnerabilities in a global supply chain using geographic data.', techStack: ['Excel', 'PowerBI'], difficulty: 'Intermediate', skills_practiced: ['Risk Management', 'Operations'] },
    { title: 'Requirements Traceability Matrix', description: 'Develop a comprehensive RTM for a large-scale software project, linking requirements to test cases.', techStack: ['Jira', 'Confluence', 'Excel'], difficulty: 'Intermediate', skills_practiced: ['Requirements Management', 'Quality Assurance'] },
    { title: 'Business Process Automation (RPA)', description: 'Identify and automate a repetitive business process using Robotic Process Automation tools.', techStack: ['UiPath', 'Automation Anywhere', 'Blue Prism'], difficulty: 'Advanced', skills_practiced: ['Process Automation', 'Efficiency Improvement'] }
  ],
  'Data Engineer': [
    { title: 'Real-time Streaming ETL', description: 'Architect a high-throughput event processing pipeline using Kafka and Spark.', techStack: ['Kafka', 'Spark', 'Scala'], difficulty: 'Advanced', skills_practiced: ['Streaming', 'ETL', 'Data Engineering'] },
    { title: 'Warehouse Schema Migration', description: 'Redesign a legacy DB into a Star Schema for optimized analytical querying.', techStack: ['dbt', 'Snowflake', 'SQL'], difficulty: 'Intermediate', skills_practiced: ['Data Modeling', 'dbt', 'SQL'] },
    { title: 'Data Quality Sentinel', description: 'Implement automated data validation checks with Great Expectations and Airflow.', techStack: ['Python', 'Airflow', 'SQL'], difficulty: 'Intermediate', skills_practiced: ['Data Governance', 'Validation'] },
    { title: 'Log Aggregation Engine', description: 'Collect and parse terabytes of server logs into a searchable Elasticsearch index.', techStack: ['ELK Stack', 'Fluentd'], difficulty: 'Advanced', skills_practiced: ['Infrastructure', 'NoSQL'] },
    { title: 'Delta Lakehouse Deployment', description: 'Provision a modern data lakehouse architecture with ACID transactions using Terraform.', techStack: ['Terraform', 'Spark', 'Delta Lake'], difficulty: 'Advanced', skills_practiced: ['Data Infrastructure', 'IaC', 'Spark'] },
    { title: 'Debezium CDC Pipeline', description: 'Implement Change Data Capture from a legacy Postgres DB to a real-time analytics warehouse.', techStack: ['Kafka', 'Debezium', 'PostgreSQL'], difficulty: 'Advanced', skills_practiced: ['CDC', 'Kafka', 'Data Engineering'] }
  ]
};

// ─── Core Analysis Functions ──────────────────────────────────────────────────

function extractSkillsFromText(text: string, role: string): string[] {
  const lower = text.toLowerCase();
  const roleSkills = ROLE_SKILLS[role] || ROLE_SKILLS['Backend Developer'];
  
  return roleSkills.filter(skill => {
    const skillLower = skill.toLowerCase();
    // Use regex with word boundaries to match exact skills
    // We escape special characters like c++ or .net
    const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    
    // Special case for skills with symbols that \b doesn't handle well
    if (skillLower.includes('+') || skillLower.includes('.') || skillLower.includes('#')) {
      return lower.includes(skillLower);
    }
    
    return regex.test(lower);
  });
}

function computeScore(found: string[], role: string): number {
  const total = (ROLE_SKILLS[role] || ROLE_SKILLS['Backend Developer']).length;
  return Math.min(100, Math.round((found.length / total) * 100 * 1.5)); // 1.5× boost so mid-level resumes score reasonably
}

function getMissingSkills(found: string[], role: string): string[] {
  const all = ROLE_SKILLS[role] || ROLE_SKILLS['Backend Developer'];
  const foundLower = found.map(s => s.toLowerCase());
  return all.filter(s => !foundLower.includes(s.toLowerCase())).slice(0, 10);
}

function getRecommendedProjects(missing: string[], role: string): AnalysisResult['recommendedProjects'] {
  const bank = PROJECT_BANK[role] || PROJECT_BANK['Backend Developer'];
  // Prefer projects that help with the most missing skills
  const scored = bank.map(p => ({
    ...p,
    _score: (p.skills_practiced || []).filter(s => missing.some(m => m.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(m.toLowerCase()))).length,
  }));
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, 6).map(({ _score, ...p }) => p);
}

// ─── Public API (same interface as before) ────────────────────────────────────

export async function analyzeResume(
  targetRole: string,
  resumeText: string,
): Promise<AnalysisResult & { extractedSkills: string[] }> {
  const extractedSkills = extractSkillsFromText(resumeText, targetRole);
  const matchScore = computeScore(extractedSkills, targetRole);
  const missingSkills = getMissingSkills(extractedSkills, targetRole);
  const recommendedProjects = getRecommendedProjects(missingSkills, targetRole);
  return { matchScore, extractedSkills, missingSkills, recommendedProjects };
}

export async function analyzeSkills(
  targetRole: string,
  currentSkills: string[],
): Promise<AnalysisResult> {
  const fakeText = currentSkills.join(' ');
  const extracted = extractSkillsFromText(fakeText, targetRole);
  const matchScore = computeScore(extracted, targetRole);
  const missingSkills = getMissingSkills(extracted, targetRole);
  const recommendedProjects = getRecommendedProjects(missingSkills, targetRole);
  return { matchScore, missingSkills, recommendedProjects };
}

export async function suggestJobRoles(
  resumeTextOrSkills: string | string[]
): Promise<RoleSuggestion[]> {
  const text = Array.isArray(resumeTextOrSkills) ? resumeTextOrSkills.join(' ') : resumeTextOrSkills;
  const suggestions: RoleSuggestion[] = [];

  for (const role in ROLE_SKILLS) {
    const extracted = extractSkillsFromText(text, role);
    const score = computeScore(extracted, role);
    
    if (score > 0) {
      suggestions.push({
        role,
        matchScore: score,
        reason: `Matches ${extracted.length} key competencies for this role.`
      });
    }
  }

  // Sort by score and take top 5
  return suggestions
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}
