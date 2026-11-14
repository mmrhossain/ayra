import { Router } from "express";
import legalRoutes from "./legal/routes/legal.routes.ts";
import faqRoutes from "./faq/routes/faq.routes.ts";
import blogRoutes from "./blog/routes/blog.routes.ts";
import contactRoutes from "./contact/routes/contact.routes.ts";

const router = Router();

router.use(legalRoutes);
router.use(faqRoutes);
router.use(blogRoutes);
router.use(contactRoutes);

export default router;
