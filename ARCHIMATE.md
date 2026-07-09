# ARISE — ArchiMate Modeling Guide

This guide is designed to help you translate the existing `ARCHITECTURE.md` diagrams (Mermaid) into formal **ArchiMate 3.2** models using your dedicated ArchiMate software (such as Archi, BizzDesign, etc.). 

ArchiMate can feel overwhelming because it has many element types. The trick is to focus only on the **core elements** across the three main layers: **Business**, **Application**, and **Technology**.

---

## 1. Quick Reference: Elements to Use

For the ARISE project, you only need a small subset of the ArchiMate palette:

### 🟡 Business Layer (Yellow)
*   **Business Actor** (Stick figure): A physical person (e.g., *Pharmacy Staff*, *Ward Staff*).
*   **Business Role** (Cylinder with a person inside): A role played by an actor (e.g., *Issuer*, *Indenter*).
*   **Business Process** (Chevron): A sequence of activities (e.g., *Routine Indent Workflow*, *Short Expiry Tracking*).

### 🔵 Application Layer (Blue)
*   **Application Component** (Box with two small boxes on the left): A software application or module (e.g., *React Frontend*, *Express Backend*, *PhIS Automation Script*).
*   **Application Interface** (Circle with a line): A point of access (e.g., *REST API*, *PhIS Web Interface*).
*   **Data Object** (Rectangle with a folded corner): Data used by the app (e.g., *Inventory Item*, *Indent Session*).

### 🟢 Technology Layer (Green)
*   **Node** (3D Box): A physical or virtual machine (e.g., *Production Server*, *Client Device*).
*   **System Software** (Box with a disc icon): OS or server software (e.g., *PM2*, *Apache2*, *PostgreSQL*, *Node.js*).
*   **Technology Interface** (Circle with a line): e.g., *Port 3005*, *Port 80/443*.

---

## 2. Step-by-Step Modeling Guide

When building your ArchiMate model, it is best to build it from the bottom up (Technology $\rightarrow$ Application $\rightarrow$ Business) or top down. Here is a guided approach.

### Step 1: The Technology & Infrastructure View
*Based on: "1. Technology View" in ARCHITECTURE.md*

1.  **Create a Node** (🟢) named "Production Server".
2.  **Inside the Node, create System Software** (🟢) elements:
    *   "Apache2" (Reverse Proxy)
    *   "PM2" (Process Manager)
    *   "Node.js Runtime"
    *   "PostgreSQL" (Database System)
3.  **Create an external Node** (🟢) named "PhIS Server" and add a **Technology Interface** (🟢) for "10.77.232.70:8080".
4.  **Create a Node** (🟢) named "Client Device" with a **System Software** (🟢) element named "Web Browser".
5.  *Relations:* Use the **Serving** relation (solid line, open arrow) from "Apache2" to "Web Browser".

### Step 2: The Application Layer
*Based on: "3. Application Structure View" in ARCHITECTURE.md*

1.  **Create Application Components** (🔵):
    *   "ARISE SPA (React/Vite)"
    *   "ARISE API (Express)"
    *   "PhIS Automation Engine (Playwright)"
2.  **Create an Application Interface** (🔵):
    *   "ARISE REST API"
3.  **Create Data Objects** (🔵) for your core tables:
    *   "User", "Inventory Item", "Indent Session", "Indent Request".
4.  *Relations:*
    *   Use **Realization** (dashed line, closed triangle) from the "ARISE API" component to the "ARISE REST API" interface.
    *   Use **Serving** (solid line, open arrow) from the "ARISE REST API" interface to the "ARISE SPA" component.
    *   Use **Access** (dashed line, open arrow) from the "ARISE API" to the Data Objects.
5.  *Cross-Layer Relations:* Use **Realization** from the Technology Layer's "Node.js Runtime" to the "ARISE API" Application Component.

### Step 3: The Business Layer (Roles & Actors)
*Based on: "4. Business Hierarchy" in ARCHITECTURE.md*

1.  **Create Business Actors** (🟡):
    *   "Pharmacy Staff / Admin"
    *   "Counter / Ward Staff"
2.  **Create Business Roles** (🟡):
    *   "Issuer"
    *   "Indenter"
3.  *Relations:*
    *   Use **Assignment** (solid line, black dot at the end) to assign "Pharmacy Staff" to the "Issuer" role.
    *   Use **Assignment** to assign "Counter / Ward Staff" to the "Indenter" role.

### Step 4: The Process Workflows
*Based on: "2. Process Workflow" in ARCHITECTURE.md*

Instead of highly detailed flowcharts, ArchiMate processes are high-level. Let's model the "Routine Indent Workflow":

1.  **Create Business Processes** (🟡):
    *   "Draft Routine Indent"
    *   "Submit Indent"
    *   "Review & Approve Indent"
    *   "Automate PhIS Entry"
2.  *Relations:*
    *   Use **Triggering** (solid line, filled arrow) to connect the processes in sequence: Draft $\rightarrow$ Submit $\rightarrow$ Review $\rightarrow$ Automate.
    *   Use **Assignment** to assign the "Indenter" role to "Draft" and "Submit".
    *   Use **Assignment** to assign the "Issuer" role to "Review" and "Automate".
3.  *Cross-Layer Relations:*
    *   Use **Serving** from the "ARISE SPA" (Application Component) to the "Draft Routine Indent" and "Submit Indent" processes.
    *   Use **Serving** from the "PhIS Automation Engine" (Application Component) to the "Automate PhIS Entry" process.

---

## 3. Recommended Diagram Views in your Software

Don't try to put everything on one massive canvas. Most ArchiMate tools allow you to create multiple "Views". Create the following views to keep things clean:

1.  **Actor/Role View:** Just the yellow actors and roles, showing who does what.
2.  **Infrastructure View:** Just the green nodes and system software showing how the server is set up.
3.  **Application Cooperation View:** Just the blue application components and how they talk to each other (Frontend $\rightarrow$ API $\rightarrow$ Database $\rightarrow$ PhIS).
4.  **Process View (per workflow):** A view for the Routine Indent workflow mapping the sequence of yellow processes to the specific blue application components that support them.

## 4. Tips for Dealing with the Software Overwhelment

*   **Ignore elements you don't need:** ArchiMate has elements like *Meaning*, *Value*, *Driver*, and *Plateau*. Ignore them. Stick to the 9 core elements listed in Section 1.
*   **The "Magic Connector":** If you use the open-source software "Archi", you can select the "Magic Connector" tool, drag a line between two elements, and it will only show you the *legally allowed* ArchiMate relations between those two specific elements. This is the easiest way to learn how things connect.
*   **Colors matter:** Stick to the default colors (Yellow = Business, Blue = Application, Green = Technology). It makes reading the diagram instantly intuitive.
