import { Handler } from "./Handler"
import { Method } from "./Method"
import { Route } from "./Route"

export class Router {
	private readonly routes: [Route, Handler][] = []
	origin: string[] = ["*"]
	add(method: Method | Method[], pattern: string, handler: Handler) {
		this.routes.push([Route.create(method, pattern), handler])
	}
	async handle(event: FetchEvent): Promise<Response> {
		let result: Response | undefined
		let allowedMethods: Method[] = []
		for (const route of this.routes) {
			const r = route[0].match(event.request)
			if (r)
				if (route[0].methods.some(m => m == event.request.method)) {
					result = await route[1](event, r.parameter)
					break
				} else
					allowedMethods = allowedMethods.concat(...route[0].methods)
		}
		return (
			result ||
			(allowedMethods.length == 0
				? new Response(undefined, { status: 404 })
				: event.request.method == "OPTIONS"
				? new Response(undefined, {
						status: 204,
						headers: [
							["Access-Control-Allow-Origin", this.origin.join(", ")],
							["Access-Control-Allow-Methods", allowedMethods.join(", ")],
							["Access-Control-Allow-Headers", "Content-Type"],
						],
				  })
				: new Response(undefined, { status: 405, headers: [["Allow", allowedMethods.join(", ")]] }))
		)
	}
}