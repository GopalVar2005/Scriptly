/**
 * demoData.js — Curated demo content for the "Try Demo" experience.
 * 
 * This is NOT fake AI generation. It's a realistic, pre-curated example
 * of what Scriptly produces from a real lecture topic.
 * 
 * Structure matches exactly what the AI pipeline returns so the same
 * components (Flashcard, Quiz, SummaryViewer) can render it.
 */

export const DEMO_TRANSCRIPT = `Today we're going to talk about how the internet actually works at a fundamental level. When you type a URL into your browser, a complex series of events happens behind the scenes. First, your browser needs to figure out the IP address of the server you're trying to reach. This is where DNS, or the Domain Name System, comes in. DNS is essentially the phonebook of the internet — it translates human-readable domain names like google.com into IP addresses like 142.250.80.46.

Once your browser has the IP address, it establishes a TCP connection with the server using a process called the three-way handshake. Your computer sends a SYN packet, the server responds with a SYN-ACK, and your computer sends back an ACK. This ensures both sides are ready to communicate.

After the TCP connection is established, if you're visiting an HTTPS site, a TLS handshake occurs. This is where encryption is set up. The server sends its SSL certificate, your browser verifies it, and they agree on encryption keys. This is what makes your data secure in transit.

Now your browser can finally send an HTTP request. The server processes it and sends back an HTTP response containing the HTML, CSS, JavaScript, and other assets needed to render the page. Your browser then parses this HTML, builds the DOM tree, applies CSS styles to create the render tree, and finally paints the pixels on your screen.

This entire process — DNS lookup, TCP handshake, TLS handshake, HTTP request, and rendering — typically happens in under a second. Understanding this pipeline is essential for web developers because it helps you optimize performance, debug network issues, and build more efficient applications.`;

export const DEMO_SUMMARY = {
  subject_detected: "Computer Networking — How the Internet Works",
  quick_recap: "This lecture explains the complete lifecycle of a web request: from typing a URL to seeing a rendered page. It covers DNS resolution, TCP three-way handshake, TLS encryption setup, HTTP request/response cycle, and browser rendering pipeline (DOM → render tree → paint). Understanding this pipeline is critical for web developers working on performance optimization and debugging.",
  key_concepts: [
    {
      concept: "DNS (Domain Name System)",
      explanation: "DNS translates human-readable domain names (like google.com) into machine-readable IP addresses (like 142.250.80.46). It works like the internet's phonebook, allowing browsers to locate servers without users needing to memorize numeric addresses.",
      why_it_matters: "Without DNS, users would need to remember IP addresses for every website. DNS failures cause 'site not found' errors, making it a critical piece of internet infrastructure."
    },
    {
      concept: "TCP Three-Way Handshake",
      explanation: "TCP establishes reliable connections using a three-step process: the client sends SYN, the server responds with SYN-ACK, and the client sends ACK. This ensures both sides are synchronized and ready to exchange data.",
      why_it_matters: "TCP guarantees reliable, ordered delivery of data — unlike UDP. Understanding this handshake helps debug connection timeouts, network latency issues, and firewall configurations."
    },
    {
      concept: "TLS/SSL Encryption",
      explanation: "TLS (Transport Layer Security) creates an encrypted channel between browser and server. During the TLS handshake, the server presents its SSL certificate, the browser verifies it against trusted certificate authorities, and both sides agree on encryption keys.",
      why_it_matters: "TLS is what makes HTTPS secure. Without it, data travels in plaintext and can be intercepted. This is essential knowledge for any developer handling user data or authentication."
    },
    {
      concept: "Browser Rendering Pipeline",
      explanation: "After receiving HTML, the browser parses it into a DOM tree, applies CSS to create a render tree, calculates layout (reflow), and paints pixels to the screen. JavaScript can modify the DOM, triggering re-renders.",
      why_it_matters: "Understanding the rendering pipeline is key to building performant web apps. Unnecessary DOM manipulation or layout thrashing can cause jank and poor user experience."
    }
  ],
  important_to_remember: [
    "DNS resolves domain names to IP addresses before any connection is made",
    "TCP uses a three-way handshake (SYN → SYN-ACK → ACK) to establish reliable connections",
    "TLS/SSL encryption happens AFTER TCP connection but BEFORE HTTP requests",
    "The browser rendering pipeline: HTML → DOM → Render Tree → Layout → Paint",
    "The entire URL-to-rendered-page process typically completes in under one second"
  ],
  potential_exam_questions: [
    {
      question: "Describe the sequence of events that occurs when a user types a URL into their browser.",
      hint: "Cover DNS, TCP, TLS, HTTP, and rendering in order."
    },
    {
      question: "What is the purpose of the TCP three-way handshake?",
      hint: "Focus on reliability and synchronization between client and server."
    },
    {
      question: "Explain how TLS ensures data security during transmission.",
      hint: "Mention certificates, certificate authorities, and encryption key exchange."
    },
    {
      question: "What are the stages of the browser rendering pipeline?",
      hint: "DOM tree, render tree, layout/reflow, paint."
    }
  ],
  key_terms: {
    "DNS": "Domain Name System — translates domain names to IP addresses",
    "IP Address": "Numerical label assigned to each device on a network",
    "TCP": "Transmission Control Protocol — provides reliable, ordered data delivery",
    "TLS": "Transport Layer Security — cryptographic protocol for secure communication",
    "SSL Certificate": "Digital certificate that authenticates a server's identity",
    "HTTP": "HyperText Transfer Protocol — the foundation of data communication on the web",
    "DOM": "Document Object Model — tree representation of HTML document structure",
    "Render Tree": "Combined DOM and CSS structure used for visual rendering",
    "Three-Way Handshake": "SYN → SYN-ACK → ACK process to establish TCP connections",
    "HTTPS": "HTTP over TLS — encrypted version of HTTP"
  },
  memory_anchors: [
    "Think of DNS as the internet's contact list — you search by name, it gives you the number",
    "TCP handshake is like a phone call: 'Can you hear me?' → 'Yes, can you hear me?' → 'Yes!'",
    "TLS is like showing your ID at the door before entering a secure building",
    "The rendering pipeline is like building a house: blueprint (DOM) → structure (render tree) → finishing (paint)"
  ],
  keywords: ["DNS", "TCP", "TLS", "HTTP", "HTTPS", "SSL", "DOM", "Rendering", "Three-Way Handshake", "IP Address"]
};

export const DEMO_FLASHCARD_TERMS = [
  { front: "DNS", back: "Domain Name System — translates domain names to IP addresses, like the internet's phonebook" },
  { front: "TCP", back: "Transmission Control Protocol — provides reliable, ordered data delivery between devices" },
  { front: "TLS", back: "Transport Layer Security — cryptographic protocol that encrypts data in transit" },
  { front: "Three-Way Handshake", back: "SYN → SYN-ACK → ACK — the process TCP uses to establish a reliable connection" },
  { front: "DOM", back: "Document Object Model — a tree representation of HTML that browsers use for rendering" },
  { front: "HTTPS", back: "HTTP over TLS — the encrypted version of HTTP, indicated by the lock icon in browsers" },
  { front: "SSL Certificate", back: "Digital certificate authenticating a server's identity, verified by the browser during TLS handshake" },
  { front: "Render Tree", back: "Combined DOM and CSS structure the browser uses to determine what to paint on screen" }
];

export const DEMO_FLASHCARD_CONCEPTS = [
  { front: "DNS Resolution", back: "Your browser queries DNS servers to convert a domain name (google.com) into an IP address (142.250.80.46) before any connection is made." },
  { front: "TCP Three-Way Handshake", back: "Client sends SYN, server responds SYN-ACK, client sends ACK. This synchronizes both sides and establishes a reliable connection." },
  { front: "TLS/SSL Encryption", back: "Server presents certificate → browser verifies → both agree on encryption keys. This creates the secure channel for HTTPS." },
  { front: "Browser Rendering Pipeline", back: "HTML → DOM tree → apply CSS → render tree → layout (reflow) → paint pixels. JavaScript can modify DOM and trigger re-renders." }
];

export const DEMO_QUIZ_DATA = [
  {
    question: "What does DNS stand for?",
    correct_answer: "Domain Name System",
    distractors: ["Data Network Service", "Digital Naming Standard", "Direct Name Server"]
  },
  {
    question: "What is the correct order of the TCP three-way handshake?",
    correct_answer: "SYN → SYN-ACK → ACK",
    distractors: ["ACK → SYN → SYN-ACK", "SYN-ACK → SYN → ACK", "ACK → SYN-ACK → SYN"]
  },
  {
    question: "What happens during the TLS handshake?",
    correct_answer: "The server presents its certificate and encryption keys are established",
    distractors: ["The browser sends its password to the server", "IP addresses are exchanged between client and server", "The DOM tree is constructed"]
  },
  {
    question: "What is the render tree?",
    correct_answer: "A combination of DOM and CSS used to determine visual rendering",
    distractors: ["A list of all JavaScript functions on a page", "The server's file directory structure", "A network routing table for HTTP requests"]
  },
  {
    question: "Which protocol ensures data is encrypted during transmission?",
    correct_answer: "TLS (Transport Layer Security)",
    distractors: ["TCP (Transmission Control Protocol)", "DNS (Domain Name System)", "FTP (File Transfer Protocol)"]
  }
];
