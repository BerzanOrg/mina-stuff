import assert from "node:assert";
import { before, describe, it } from "node:test";
import { AccountUpdate, MerkleMap, MerkleTree, Mina, Poseidon, PrivateKey, UInt32 } from "o1js";
import { MessageBox } from "./MessageBox.js";

describe('Challange 1 Tests', async () => {
    const LocalBlockchain = Mina.LocalBlockchain({ proofsEnabled: false })
    Mina.setActiveInstance(LocalBlockchain)
    const admin = LocalBlockchain.testAccounts[0]
    const user1 = LocalBlockchain.testAccounts[1]
    const user2 = LocalBlockchain.testAccounts[2]
    const user3 = LocalBlockchain.testAccounts[3]
    const user4 = LocalBlockchain.testAccounts[4]

    const privateKeyOfContract = PrivateKey.random()

    const mapOfAddresses = new MerkleMap()
    const mapOfMessages = new MerkleMap()
    const msgBox = new MessageBox(privateKeyOfContract.toPublicKey())

    it("can compile contract", async () => {
        await MessageBox.compile()
    })

    it("can deploy the contract", async () => {
        const tx = await Mina.transaction(admin.publicKey, () => {
            msgBox.deploy()
            AccountUpdate.fundNewAccount(admin.publicKey)
        })
        await tx.prove()
        tx.sign([admin.privateKey, privateKeyOfContract])
        await tx.send()

        const onChainAdmin = msgBox.admin.get()
        const onChainRoot = msgBox.rootOfAddresses.get()
        const onChainCount = msgBox.countOfAddresses.get()
        assert.deepEqual(onChainAdmin, admin.publicKey)
        assert.deepEqual(onChainRoot, mapOfAddresses.getRoot())
        assert.deepEqual(onChainCount, UInt32.zero)
    })

    it("admin can store an address", async () => {
        const tx = await Mina.transaction(admin.publicKey, () => {
            const witness = mapOfAddresses.getWitness(Poseidon.hash(user1.publicKey.toFields()))
            msgBox.storeAddress(witness)
        })
        await tx.prove()
        tx.sign([admin.privateKey])
        await tx.send()

        const onChainRoot = msgBox.rootOfAddresses.get()
        const onChainCount = msgBox.countOfAddresses.get()
        assert.deepEqual(onChainRoot, mapOfAddresses.getRoot())
        assert.deepEqual(onChainCount, UInt32.one)
    })

    it("non-admins can't store an address", async () => {
        try {
            const tx = await Mina.transaction(user2.publicKey, () => {
                const witness = mapOfAddresses.getWitness(Poseidon.hash(user2.publicKey.toFields()))
                msgBox.storeAddress(witness)
            })
            assert(false, "should've failed")
        } catch { }
    })

    it("eligible address can deposit a message", async () => {
        const tx = await Mina.transaction(user1.publicKey, () => {
            const witness = mapOfAddresses.getWitness(Poseidon.hash(user1.publicKey.toFields()))
            msgBox.depositMessage(witness)
        })
        await tx.prove()
        tx.sign([user1.privateKey])
        await tx.send()
    })
    

    it("non-eligible addresses can't deposit a message", async () => {
        try {
            const tx = await Mina.transaction(user2.publicKey, () => {
                const witness = mapOfAddresses.getWitness(Poseidon.hash(user2.publicKey.toFields()))
                msgBox.depositMessage(witness)
            })
            assert(false, "should've failed")
        } catch { }
    })
})