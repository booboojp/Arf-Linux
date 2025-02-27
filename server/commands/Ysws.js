const Command = require(`../utils/Command.js`);
const supabase = require(`../database/supabase`);

class YSWSCommand extends Command {
    constructor() {
        super({
            name: `ysws`,
            aliases: [`project`, `p`],
            params: [],
            requiresAuth: true,
            description: `Manage YSWS projects. Actions: create, search, list. Usage ysws`,
            isInteractive: true,
        });
    }

    async beforeExecute(req) {
        if (!supabase.auth.getUser()) {
            throw new Error(`Not authenticated with Supabase`);
        }
        await super.beforeExecute(req);
    }

    async startInteractiveMode(req) {
        this.interactiveState = { step: 0, data: {} };
        return {
            awaitingInput: true,
            prompt: this.getNextPrompt()
        };
    }

    getNextPrompt() {
        const { step, data } = this.interactiveState;
        if (!this.interactiveState) return `Select action (create/list/search):`;
        if (step === 0) return `Select action (create/list/search):`;
        if (step === 1 && data.type === `create`) return `Enter project title:`;
        if (step === 2 && data.type === `create`) return `Enter project description:`;
        if (step === 3 && data.type === `create`) return `Enter project tags (comma-separated ie: "test,ysws,arf-linux"):`;
        if (step === 1 && data.type === `search`) return `Enter tags to search for (comma-separated):`;
    }

    async nextStep(input, req) {
        const { step, data } = this.interactiveState;
		let inputFixed = input.trim();
        if (step === 0) {
            if (inputFixed === `create` || inputFixed === `list` || inputFixed === `search`) {
                data.type = input;
                this.interactiveState.step++;
                return {
                    awaitingInput: true,
                    prompt: this.getNextPrompt(),
                };
            }
            return {
                awaitingInput: true,
                prompt: `Invalid input. Select action (create/list/search):`,
            };
        }
        if (step === 1 && data.type === `create`) {
			console.log(inputFixed);
            if (inputFixed.length < 4) return { awaitingInput: true, prompt: `Invalid input. Enter project title:` };
			data.title = inputFixed
			this.interactiveState.step++;
			return { awaitingInput: true, prompt: this.getNextPrompt(), timeout: this.interactionTimeout };
        }
		if (step === 2 && data.type === `create`) {
			if (inputFixed.length < 10) return { awaitingInput: true, prompt: `Invalid input. Enter project description:` };
			data.description = inputFixed;
			this.interactiveState.step++;
			return { awaitingInput: true, prompt: this.getNextPrompt(), timeout: this.interactionTimeout };
		}
		if (step === 3 && data.type === `create`) {
			if (input.length === 0) return { awaitingInput: true, prompt: `Invalid input. Enter project tags (comma-separated):` };
			data.tags = inputFixed.split(` `).map(tag => tag.trim());
			this.interactiveState.step++;
			await this.createEntry(data, req);
			return { awaitingInput: false, prompt: `Created project, ${data.title}`, timeout: this.interactionTimeout };
		}
		if (step === 1 && data.type === `search`) {
			if (!input.length) return { awaitingInput: true, prompt: `Invalid input. Enter tags to search for (comma-separated):` };
			data.tags = input.split(`,`).map(tag => tag.trim());
			const { data: projects, error } = await supabase.from(`ysws`).select(`*`).contains(`tags`, JSON.stringify(data.tags));
			if (error) throw error;
			if (!projects.length) return { awaitingInput: false, prompt: `No projects found.` };
			let availableProjects = []
			projects.forEach(project => {
				availableProjects.push(`Project: ${project.title} by ${project.author} ⭐ ${project.likes} - ${project.description}`);
			});
			
			return { awaitingInput: false, prompt: `Available projects:\n${availableProjects.join(`\n`)}`, timeout: this.interactionTimeout };
		}
		if (step === 1 && data.type === `list`) {
			const { data: projects, error } = await supabase.from(`ysws`).select(`*`);
			if (error) throw error;
			if (!projects.length) return { awaitingInput: false, prompt: `No projects found.` };
			let availableProjects = []
			projects.forEach(project => {
				availableProjects.push(`Project: ${project.title} by ${project.author} ⭐ ${project.likes} - ${project.description}`);
			});
			return { awaitingInput: false, prompt: `Available projects:\n${availableProjects.join(`\n`)}`, timeout: this.interactionTimeout };
		}
    }

    async handleInteractiveInput(input, req) {
        if (!this.interactiveState) throw new Error(`Interactive session not started`);
        return this.nextStep(input, req);
    }

    async execute(params, req) {
        if (params.length === 0) return await this.startInteractiveMode(req);
        return { success: false, result: `This command requires interactive mode for setup.` };
    }

    async createEntry(data, req) {
		const { title, description, tags } = data;
		if (!title || !description || !tags) throw new Error(`Invalid data`);
	
		const user = await this.getUser(req);
	
		const { data: entry, error } = await supabase.from(`ysws`).insert({
			title,
			description,
			tags,
			likes: 0,
			author: user.user_metadata.name,
			creator: user.id,
		}, { returning: `minimal` });
	
		if (error) throw error;
	}

	async getUser(req) {
		const auth = req.headers.authorization;
		if (!auth || !auth.startsWith(`Bearer `)) throw new Error(`Authentication required`);
		const token = auth.split(` `)[1];
		const { data: { user }, error } = await supabase.auth.getUser(token);
		if (error) throw error;
		if (!user) throw new Error(`User not found`);
		return user;
	}
}

module.exports = YSWSCommand;