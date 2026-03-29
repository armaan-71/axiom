# Axiom: Stateful Insight Management Engine

Axiom is a stateful insight management engine designed to transform unstructured research data into a living, evolving **"Knowledge State."** Unlike traditional repositories that function as static archives of transcripts, Axiom treats research findings as mutable data objects. It maintains a persistent repository of institutional insights, updating their validity, support, and strategic implications in real-time as new data is ingested.

---

## 🏗️ Core Architecture: The Stateful Insight Object

The primary unit of data in Axiom is the **Insight Object**. This entity aggregates evidence across multiple sessions and studies to represent the "Current Truth" of a specific theme.

### Observable Metrics:

- **Claim**: A semantic assertion (e.g., "Users find the 'Standard' tier overpriced").
- **Support Count**: A running tally of unique participants confirming the claim.
- **Conflict Count**: A running tally of unique participants contradicting the claim.
- **Signal Recency**: A timestamp of the most recent evidence, used to track market shifts and signal decay.
- **Evidence Trace**: Direct UUID mapping to specific video timestamps and transcript lines (the "Ground Truth").

---

## ⚙️ The Mutation Engine (Logic Flow)

The system utilizes a continuous feedback loop to evolve the knowledge state without re-processing historical archives:

1. **Semantic Mapping**: Incoming data is mapped against existing Insight Objects using vector similarity to determine if it addresses a known theme or represents an emerging one.
2. **Classification**: The engine classifies new evidence as either Supporting or Conflicting relative to the existing state.
3. **State Mutation**: The engine increments the relevant counts and updates the `last_mention` timestamp.
4. **Conflict Detection**: If the ratio of Conflict to Support shifts significantly, the system flags the Insight as "Contested," alerting stakeholders to a change in market sentiment.

---

## 📈 The Decision Layer

Axiom synthesizes the current state of an insight into actionable business logic:

- **Implications**: Automated analysis of how an insight impacts specific KPIs (e.g., "High risk to New User conversion").
- **Suggested Actions**: Data-backed hypotheses for product or marketing teams (e.g., "A/B test a simplified 2-step onboarding flow").
- **Risk Evaluation**: Identification of "Contested Truths" where data is split across different segments (e.g., "Conflict: Power Users find the feature intuitive, but New Users are overwhelmed").

---

## 🛠️ Technical Stack

| Component             | Technology                                                |
| :-------------------- | :-------------------------------------------------------- |
| **Frontend**          | React 19 / TypeScript / Tailwind CSS / shadcn/ui          |
| **Backend**           | Node.js (Express) / TypeScript                            |
| **Axiom Core**        | Custom Mutation & Extraction logic (Proprietary)          |
| **LLM Orchestration** | **Groq SDK (Llama-3-70b/3.3-70b)** (High-speed inference) |
| **Embedding Layer**   | **Voyage AI (voyage-3)** (Cloud-based 1024-dim vectors)   |
| **Primary Database**  | PostgreSQL (Relational metadata and Insight Repository)   |
| **Vector Database**   | PGVector (Semantic similarity search `<=>`)               |
| **Real-time Engine**  | WebSockets (Socket.io) (Pushing instant state updates)    |

---

## 💡 Strategic Differentiation

- **Institutional Persistence**: Every new transcript builds upon the previous one, eradicating "Research Amnesia."
- **Operational Efficiency**: Processes only the **Delta** (new data) against the **State** (current knowledge), eliminating costly re-analysis.
- **Verifiable Evidence**: Every insight is hard-linked to its atomic evidence (Ground Truth), making it audit-ready.
- **Zero-Cost Infrastructure**: Optimized for high-performance cloud operations without any API subscription overhead.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL with `pgvector` extension
- Groq API Key
- Voyage AI API Key

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/armaan-71/axiom.git
    cd axiom
    ```

2.  **Install dependencies**:

    ```bash
    cd server && npm install
    cd ../client && npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the `server/` directory:

    ```env
    GROQ_API_KEY=your_groq_key
    VOYAGE_API_KEY=your_voyage_key
    DATABASE_URL=postgresql://user:password@localhost:5432/axiom
    ```

4.  **Run the application**:
    From the root (using two terminals):
    ```bash
    # Terminal 1
    cd server && npm run dev
    # Terminal 2
    cd client && npm run dev
    ```
